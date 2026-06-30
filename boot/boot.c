#include <efi.h>
#include <efilib.h>
#include "hazoom_logo.h"

#define KERNEL_PHYS_ADDR 0x200000
#define KERNEL_PATH L"\\hazoom-kernel.bin"

typedef void (*kernel_entry_t)(uint64_t boot_magic, uint64_t boot_info);

EFI_STATUS efi_main(EFI_HANDLE ImageHandle, EFI_SYSTEM_TABLE *SystemTable) {
    InitializeLib(ImageHandle, SystemTable);
    uefi_call_wrapper(ST->ConOut->ClearScreen, 1, ST->ConOut);

    Print(L"\n%s\n", hazoom_logo);
    Print(L"HAZOOM OS v6.0 - UEFI Bootloader\n\n");

    EFI_LOADED_IMAGE_PROTOCOL *loaded_img;
    EFI_STATUS status = uefi_call_wrapper(BS->OpenProtocol, 6,
        ImageHandle, &gEfiLoadedImageProtocolGuid, (void**)&loaded_img,
        ImageHandle, NULL, EFI_OPEN_PROTOCOL_BY_HANDLE_PROTOCOL);
    if (EFI_ERROR(status)) {
        Print(L"ERROR: Failed to open loaded image protocol: %r\n", status);
        goto hang;
    }

    Print(L"Device handle: %p\n", loaded_img->DeviceHandle);

    EFI_SIMPLE_FILE_SYSTEM_PROTOCOL *file_system;
    status = uefi_call_wrapper(BS->OpenProtocol, 6,
        loaded_img->DeviceHandle, &gEfiSimpleFileSystemProtocolGuid,
        (void**)&file_system, ImageHandle, NULL,
        EFI_OPEN_PROTOCOL_BY_HANDLE_PROTOCOL);
    if (EFI_ERROR(status)) {
        Print(L"ERROR: Failed to open filesystem: %r\n", status);
        goto hang;
    }

    EFI_FILE_HANDLE root_volume;
    status = uefi_call_wrapper(file_system->OpenVolume, 2, file_system, &root_volume);
    if (EFI_ERROR(status)) {
        Print(L"ERROR: Failed to open root volume: %r\n", status);
        goto hang;
    }

    EFI_FILE_HANDLE kernel_file;
    status = uefi_call_wrapper(root_volume->Open, 5, root_volume, &kernel_file,
        KERNEL_PATH, EFI_FILE_MODE_READ, EFI_FILE_READ_ONLY | EFI_FILE_HIDDEN | EFI_FILE_SYSTEM);
    if (EFI_ERROR(status)) {
        Print(L"ERROR: Kernel not found (%r)\n", status);
        Print(L"Path: %s\n", KERNEL_PATH);
        uefi_call_wrapper(root_volume->Close, 1, root_volume);
        goto hang;
    }

    UINT64 file_size = 0;
    uefi_call_wrapper(kernel_file->SetPosition, 2, kernel_file, ~0ULL);
    uefi_call_wrapper(kernel_file->GetPosition, 2, kernel_file, &file_size);
    uefi_call_wrapper(kernel_file->SetPosition, 2, kernel_file, 0);

    Print(L"Kernel size: %d bytes\n", file_size);

    if (file_size == 0 || file_size > 16*1024*1024) {
        Print(L"ERROR: Invalid kernel size\n");
        uefi_call_wrapper(kernel_file->Close, 1, kernel_file);
        goto hang;
    }

    status = uefi_call_wrapper(kernel_file->Read, 3, kernel_file, &file_size,
        (void*)KERNEL_PHYS_ADDR);
    if (EFI_ERROR(status)) {
        Print(L"ERROR: Read failed: %r\n", status);
        uefi_call_wrapper(kernel_file->Close, 1, kernel_file);
        goto hang;
    }

    uefi_call_wrapper(kernel_file->Close, 1, kernel_file);
    Print(L"Kernel loaded to 0x%x\n", KERNEL_PHYS_ADDR);

    UINTN mmap_size = 0, map_key = 0, desc_size = 0;
    UINT32 desc_version = 0;
    status = uefi_call_wrapper(BS->GetMemoryMap, 5, &mmap_size, NULL,
        &map_key, &desc_size, &desc_version);
    if (status != EFI_BUFFER_TOO_SMALL) {
        Print(L"ERROR: GetMemoryMap failed: %r\n", status);
        goto hang;
    }

    mmap_size += desc_size * 64;
    void *mmap_buf = AllocatePool(mmap_size);
    if (!mmap_buf) {
        Print(L"ERROR: Allocation failed\n");
        goto hang;
    }

    status = uefi_call_wrapper(BS->GetMemoryMap, 5, &mmap_size, mmap_buf,
        &map_key, &desc_size, &desc_version);
    if (EFI_ERROR(status)) {
        Print(L"ERROR: GetMemoryMap retry: %r\n", status);
        goto hang;
    }
    Print(L"Memory map: %d entries\n", mmap_size / desc_size);

    status = uefi_call_wrapper(BS->ExitBootServices, 2, ImageHandle, map_key);
    if (EFI_ERROR(status)) {
        Print(L"ERROR: ExitBootServices: %r\n", status);
        goto hang;
    }

    Print(L"Handing off to HAZOOM kernel...\n");

    kernel_entry_t kernel = (kernel_entry_t)(KERNEL_PHYS_ADDR);
    kernel(0x48414F4D, (uint64_t)mmap_buf);

    return EFI_SUCCESS;

hang:
    Print(L"\nSystem halted.\n");
    while (1) { __asm__ volatile("hlt"); }
    return EFI_LOAD_ERROR;
}
