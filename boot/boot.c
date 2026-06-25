/*
 * HAZOOM OS v6.0 — UEFI Bootloader
 *
 * This bootloader is the first stage of HAZOOM OS. It runs in UEFI firmware
 * context, locates the kernel binary on the EFI System Partition, loads it
 * into memory, retrieves the final memory map, exits UEFI boot services,
 * and transfers control to the kernel entry point.
 *
 * Built with GNU-EFI (libgnuefi + efilib).
 */

#include <efi.h>
#include <efilib.h>

#include "hazoom_logo.h"

/* Kernel load address — 2 MB mark, a conventional safe load point */
#define KERNEL_LOAD_ADDR    0x200000

/* Kernel file path on the EFI System Partition (backslashes for UEFI) */
#define L"\\HAZOOM\\kernel.bin"

/* Maximum buffer for memory map descriptor versioning */
#define MEMMAP_SIZE         (4096 * 16)

/*
 * kernel_entry_t — calling convention for the kernel's entry point.
 * The kernel receives no arguments from the bootloader; it is expected
 * to set up its own environment from the boot info we leave in registers
 * and at KERNEL_LOAD_ADDR.
 */
typedef void (EFIAPI *kernel_entry_t)(VOID);

/*
 * Simple helper: read an entire file from the EFI File System.
 * Returns EFI_SUCCESS on success; *buffer is allocated from boot services.
 */
static EFI_STATUS
ReadFile(EFI_FILE_HANDLE File, UINTN *Size, VOID **Buffer)
{
    EFI_STATUS Status;
    EFI_FILE_INFO *FileInfo;
    UINTN FileInfoSize;

    /* Get file size from EFI_FILE_INFO */
    FileInfoSize = 0;
    Status = File->GetInfo(File, &gEfiFileInfoGuid, &FileInfoSize, NULL);
    if (Status != EFI_BUFFER_TOO_SMALL) {
        return Status;
    }

    FileInfo = AllocatePool(FileInfoSize);
    if (FileInfo == NULL) {
        return EFI_OUT_OF_RESOURCES;
    }

    Status = File->GetInfo(File, &gEfiFileInfoGuid, &FileInfoSize, FileInfo);
    if (EFI_ERROR(Status)) {
        FreePool(FileInfo);
        return Status;
    }

    *Size = FileInfo->FileSize;
    FreePool(FileInfo);

    *Buffer = AllocatePool(*Size);
    if (*Buffer == NULL) {
        return EFI_OUT_OF_RESOURCES;
    }

    return File->Read(File, Size, *Buffer);
}

/*
 * EFI_ENTRY — UEFI application entry point.
 *
 * ImageHandle  — handle to the loaded image
 * SystemTable — pointer to the UEFI system table (boot + runtime services)
 */
EFI_STATUS
EFIAPI
efi_main(EFI_HANDLE ImageHandle, EFI_SYSTEM_TABLE *SystemTable)
{
    EFI_STATUS Status;
    EFI_LOADED_IMAGE *LoadedImage;
    EFI_FILE_HANDLE FsRoot;
    EFI_FILE_HANDLE KernelFile;
    VOID *KernelBuffer;
    UINTN KernelSize;
    EFI_PHYSICAL_ADDRESS KernelPhys;
    UINTN MapSize, MapKey, DescriptorSize;
    UINT32 DescriptorVersion;
    UINT8 *MemoryMap;
    UINTN Pages;

    /* Initialize GNU-EFI library with the system table */
    InitializeLib(ImageHandle, SystemTable);

    /* Clear the screen and set cyan text on black background */
    uefi_call_wrapper(ST->ConOut->ClearScreen, 1, ST->ConOut);
    uefi_call_wrapper(ST->ConOut->SetAttribute, 3, ST->ConOut,
                      EFI_CYAN | EFI_BACKGROUND_BLACK);

    /* Display the HAZOOM boot splash */
    Print(L"\n");
    Print(L"%s", hazoom_logo);
    Print(L"\n");
    Print(L"  Initializing HAZOOM OS bootloader...\n");
    Print(L"  Firmware vendor: %s\n", ST->FirmwareVendor);
    Print(L"\n");

    /* Get the loaded image protocol to access the file system */
    Status = uefi_call_wrapper(
        BS->OpenProtocol, 6,
        ImageHandle,
        &gEfiLoadedImageProtocolGuid,
        (VOID **)&LoadedImage,
        ImageHandle,
        NULL,
        EFI_OPEN_PROTOCOL_GET_PROTOCOL
    );
    if (EFI_ERROR(Status)) {
        Print(L"HAZOOM: Failed to open LoadedImage protocol (0x%r)\n", Status);
        goto stall;
    }

    /* Open the file system that contains this bootloader image */
    FsRoot = LibOpenRoot(LoadedImage->DeviceHandle);
    if (FsRoot == NULL) {
        Print(L"HAZOOM: Failed to open filesystem root\n");
        goto stall;
    }

    /* Attempt to open the kernel binary */
    Status = uefi_call_wrapper(
        FsRoot->Open, 5,
        FsRoot,
        &KernelFile,
        L"\\HAZOOM\\kernel.bin",
        EFI_FILE_MODE_READ,
        0
    );

    if (EFI_ERROR(Status)) {
        Print(L"HAZOOM: kernel.bin not found\n");
        goto stall;
    }

    Print(L"  Loading kernel from \\HAZOOM\\kernel.bin ...\n");

    /* Read the entire kernel into a boot-services buffer */
    KernelSize = 0;
    KernelBuffer = NULL;
    Status = ReadFile(KernelFile, &KernelSize, &KernelBuffer);
    if (EFI_ERROR(Status)) {
        Print(L"HAZOOM: Failed to read kernel (0x%r)\n", Status);
        uefi_call_wrapper(KernelFile->Close, 1, KernelFile);
        goto stall;
    }

    uefi_call_wrapper(KernelFile->Close, 1, KernelFile);

    Print(L"  Kernel size: %d bytes\n", KernelSize);

    /*
     * Allocate pages at the fixed load address for the kernel.
     * We use AllocatePages with EfiLoaderData so the kernel is placed
     * in a region the kernel's own memory manager will recognize.
     */
    Pages = (KernelSize + 0xFFF) >> 12;  /* round up to page count */
    KernelPhys = KERNEL_LOAD_ADDR;

    Status = uefi_call_wrapper(
        BS->AllocatePages, 4,
        AllocateAddress,
        EfiLoaderData,
        Pages,
        &KernelPhys
    );
    if (EFI_ERROR(Status)) {
        Print(L"HAZOOM: Failed to allocate pages for kernel (0x%r)\n", Status);
        goto stall;
    }

    /* Copy kernel binary into the allocated pages */
    CopyMem((VOID *)KernelPhys, KernelBuffer, KernelSize);
    FreePool(KernelBuffer);
    KernelBuffer = NULL;

    Print(L"  Kernel loaded at physical address 0x%lx\n", KernelPhys);

    /* Retrieve the UEFI memory map */
    MemoryMap = AllocatePool(MEMMAP_SIZE);
    if (MemoryMap == NULL) {
        Print(L"HAZOOM: Failed to allocate memory map buffer\n");
        goto stall;
    }

    MapSize = MEMMAP_SIZE;
    Status = uefi_call_wrapper(
        BS->GetMemoryMap, 5,
        &MapSize,
        MemoryMap,
        &MapKey,
        &DescriptorSize,
        &DescriptorVersion
    );
    if (Status == EFI_BUFFER_TOO_SMALL) {
        FreePool(MemoryMap);
        MemoryMap = AllocatePool(MapSize);
        if (MemoryMap == NULL) {
            Print(L"HAZOOM: Failed to allocate memory map buffer\n");
            goto stall;
        }
        Status = uefi_call_wrapper(
            BS->GetMemoryMap, 5,
            &MapSize,
            MemoryMap,
            &MapKey,
            &DescriptorSize,
            &DescriptorVersion
        );
    }
    if (EFI_ERROR(Status)) {
        Print(L"HAZOOM: Failed to get memory map (0x%r)\n", Status);
        goto stall;
    }

    Print(L"  Memory map acquired (key=0x%x, %d bytes)\n", MapKey, MapSize);

    /* Exit boot services — this is the point of no return */
    Status = uefi_call_wrapper(
        BS->ExitBootServices, 2,
        ImageHandle,
        MapKey
    );
    if (EFI_ERROR(Status)) {
        Print(L"HAZOOM: ExitBootServices failed (0x%r)\n", Status);
        Print(L"  (Try increasing MEMMAP_SIZE or retrying)\n");
        goto stall;
    }

    /*
     * Jump to the kernel entry point.
     * The kernel is loaded at KERNEL_LOAD_ADDR; we cast that address
     * to a function pointer and call it. The kernel receives no
     * arguments — it is responsible for interpreting the hardware state
     * left by this bootloader.
     */
    ((kernel_entry_t)(KernelPhys))();

    /* Should never reach here */
    return EFI_SUCCESS;

stall:
    /*
     * Fatal error — print a message and spin forever.
     * The user must power off the machine.
     */
    Print(L"\n  HAZOOM: Boot halted due to fatal error.\n");
    Print(L"  System will remain idle.\n");
    while (TRUE)
        __asm__ __volatile__ ("pause");
}
