#include <stdint.h>
#include "console.h"
#include "gdt.h"
#include "idt.h"
#include "pmm.h"
#include "process.h"
#include "qlearn.h"

#define PML4_ADDR     0x1000000
#define PDPT_ADDR     0x1010000
#define PD_ADDR       0x1020000

static void setup_kernel_page_tables(void) {
    uint64_t *pml4 = (uint64_t *)PML4_ADDR;
    uint64_t *pdpt = (uint64_t *)PDPT_ADDR;
    uint64_t *pd   = (uint64_t *)PD_ADDR;

    for (int i = 0; i < 512; i++) {
        pml4[i] = 0;
        pdpt[i] = 0;
        pd[i]   = 0;
    }

    pml4[0] = PDPT_ADDR | 0x03;
    pdpt[0] = PD_ADDR | 0x03;

    for (int i = 0; i < 5; i++) {
        pd[i] = ((uint64_t)i << 21) | 0x83;
    }

    uint64_t cr3_val = PML4_ADDR;
    __asm__ volatile("movq %0, %%cr3" : : "r"(cr3_val) : "memory");
}

static void print_num(uint64_t n) {
    char buf[24];
    int pos = 0;
    if (n == 0) { vga_putchar('0'); return; }
    while (n > 0 && pos < 23) {
        buf[pos++] = '0' + (n % 10);
        n /= 10;
    }
    for (int i = pos - 1; i >= 0; i--) vga_putchar(buf[i]);
}

static uint64_t parse_dec(const char *s) {
    uint64_t r = 0;
    while (*s >= '0' && *s <= '9') {
        r = r * 10 + (*s - '0');
        s++;
    }
    return r;
}

static void kernel_shell(void) {
    char cmdline[256];
    int cmdpos = 0;
    vga_set_color(VGA_WHITE, VGA_BLACK);
    vga_print("\n");
    vga_print("HAZOOM OS v6.0 Shell\n");
    vga_print("Available: help, ps, mem, ls, run, kill, qlearn, uptime, clear, neofetch, exit\n\n");

    while (1) {
        vga_set_color(VGA_CYAN, VGA_BLACK);
        vga_print("hazoom@os");
        vga_set_color(VGA_WHITE, VGA_BLACK);
        vga_print(":~$ ");

        cmdpos = 0;
        while (1) {
            char c = keyboard_getchar();
            if (c == '\n' || c == '\r') {
                cmdline[cmdpos] = '\0';
                vga_putchar('\n');
                break;
            } else if (c == '\b' || c == 127) {
                if (cmdpos > 0) {
                    cmdpos--;
                    vga_putchar('\b');
                    vga_putchar(' ');
                    vga_putchar('\b');
                }
            } else if (cmdpos < 255) {
                cmdline[cmdpos++] = c;
                vga_putchar(c);
            }
        }

        char *cmd = cmdline;
        while (*cmd == ' ') cmd++;

        if (*cmd == '\0') continue;

        if (cmd[0] == 'h' && cmd[1] == 'e' && cmd[2] == 'l' && cmd[3] == 'p' && (cmd[4] == '\0' || cmd[4] == ' ')) {
            vga_print("Commands:\n");
            vga_print("  help              - Show this help\n");
            vga_print("  ps                - List processes\n");
            vga_print("  mem               - Show memory info\n");
            vga_print("  ls                - List files\n");
            vga_print("  run <name>        - Create a new process\n");
            vga_print("  kill <pid>        - Terminate a process\n");
            vga_print("  qlearn            - Show Q-Learning stats\n");
            vga_print("  uptime            - Show system uptime\n");
            vga_print("  clear             - Clear screen\n");
            vga_print("  neofetch          - Show system info\n");
            vga_print("  exit              - Halt system\n");
        }
        else if (cmd[0] == 'p' && cmd[1] == 's' && (cmd[2] == '\0' || cmd[2] == ' ')) {
            vga_print("PID  PPID STATE      NAME           PRIORITY\n");
            vga_print("---  ---- -----      ----           --------\n");
            PCB_t *cur = process_list_head;
            while (cur) {
                print_num(cur->pid);
                vga_print("    ");
                print_num(cur->ppid);
                vga_print(" ");
                switch (cur->state) {
                    case PROCESS_READY:     vga_print("READY       "); break;
                    case PROCESS_RUNNING:   vga_print("RUNNING     "); break;
                    case PROCESS_BLOCKED:   vga_print("BLOCKED     "); break;
                    case PROCESS_TERMINATED: vga_print("TERMINATED  "); break;
                }
                vga_print(cur->name);
                for (int i = 0; cur->name[i]; i++);
                int pad = 12;
                for (int i = 0; cur->name[i]; i++) pad--;
                while (pad > 0) { vga_putchar(' '); pad--; }
                print_num(cur->priority);
                vga_putchar('\n');
                cur = cur->next;
            }
        }
        else if (cmd[0] == 'm' && cmd[1] == 'e' && cmd[2] == 'm' && (cmd[3] == '\0' || cmd[3] == ' ')) {
            pmm_stats_t st = pmm_get_stats();
            vga_print("Memory Info:\n");
            vga_print("  Total frames: "); print_num(st.total_frames); vga_print("\n");
            vga_print("  Free frames:  "); print_num(st.free_frames); vga_print("\n");
            vga_print("  Used frames:  "); print_num(st.used_frames); vga_print("\n");
            vga_print("  Used frames:  "); print_num(st.used_frames); vga_print("\n");
            vga_print("  Reserved:     "); print_num(st.reserved_frames); vga_print("\n");
            uint64_t total_mb = (st.total_frames * 4096) / (1024 * 1024);
            uint64_t free_mb = (st.free_frames * 4096) / (1024 * 1024);
            vga_print("  Total: "); print_num(total_mb); vga_print(" MB\n");
            vga_print("  Free:  "); print_num(free_mb); vga_print(" MB\n");
        }
        else if (cmd[0] == 'l' && cmd[1] == 's' && (cmd[2] == '\0' || cmd[2] == ' ')) {
            vga_print("/bin/   /boot/  /dev/   /etc/   /home/  /proc/\n");
            vga_print("/sys/   /tmp/   /usr/   /var/   /mnt/   /opt/\n");
            vga_print("\n");
            vga_print("Proc filesystem:\n");
            PCB_t *cur = process_list_head;
            while (cur) {
                vga_print("/proc/");
                print_num(cur->pid);
                vga_print("/status\n");
                cur = cur->next;
            }
        }
        else if (cmd[0] == 'r' && cmd[1] == 'u' && cmd[2] == 'n' && cmd[3] == ' ') {
            char *name = cmd + 4;
            while (*name == ' ') name++;
            PCB_t *p = create_process(name, (uint64_t)0, PRIORITY_NORMAL, 0);
            if (p) {
                vga_print("Created process: ");
                vga_print(p->name);
                vga_print(" (PID: ");
                print_num(p->pid);
                vga_print(")\n");
            } else {
                vga_print("Failed to create process\n");
            }
        }
        else if (cmd[0] == 'k' && cmd[1] == 'i' && cmd[2] == 'l' && cmd[3] == 'l' && cmd[4] == ' ') {
            uint64_t pid = parse_dec(cmd + 5);
            PCB_t *p = get_process((uint32_t)pid);
            if (p) {
                terminate_process((uint32_t)pid);
                vga_print("Terminated PID: ");
                print_num(pid);
                vga_print("\n");
            } else {
                vga_print("Process not found\n");
            }
        }
        else if (cmd[0] == 'q' && cmd[1] == 'l' && cmd[2] == 'e' && cmd[3] == 'a' && cmd[4] == 'r' && cmd[5] == 'n' && (cmd[6] == '\0' || cmd[6] == ' ')) {
            qlearn_dump_stats();
        }
        else if (cmd[0] == 'u' && cmd[1] == 'p' && cmd[2] == 't' && cmd[3] == 'i' && cmd[4] == 'm' && cmd[5] == 'e' && (cmd[6] == '\0' || cmd[6] == ' ')) {
            uint64_t secs = system_ticks / 100;
            uint64_t mins = secs / 60;
            uint64_t hours = mins / 60;
            vga_print("Uptime: ");
            print_num(hours); vga_print("h ");
            print_num(mins % 60); vga_print("m ");
            print_num(secs % 60); vga_print("s");
            vga_print(" (");
            print_num(system_ticks); vga_print(" ticks)\n");
        }
        else if (cmd[0] == 'c' && cmd[1] == 'l' && cmd[2] == 'e' && cmd[3] == 'a' && cmd[4] == 'r' && (cmd[5] == '\0' || cmd[5] == ' ')) {
            vga_clear();
        }
        else if (cmd[0] == 'n' && cmd[1] == 'e' && cmd[2] == 'o' && cmd[3] == 'f' && cmd[4] == 'e' && cmd[5] == 't' && cmd[6] == 'c' && cmd[7] == 'h' && (cmd[8] == '\0' || cmd[8] == ' ')) {
            vga_set_color(VGA_WHITE, VGA_BLACK);
            vga_print("       ██╗  ██╗ █████╗ ███████╗ ██████╗  ██████╗ ███╗   ███╗\n");
            vga_print("       ██║  ██║██╔══██╗╚══███╔╝██╔═══██╗██╔═══██╗████╗ ████║\n");
            vga_print("       ███████║███████║  ███╔╝ ██║   ██║██║   ██║██╔████╔██║\n");
            vga_print("       ██╔══██║██╔══██║ ███╔╝  ██║   ██║██║   ██║██║╚██╔╝██║\n");
            vga_print("       ██║  ██║██║  ██║███████╗╚██████╔╝╚██████╔╝██║ ╚═╝ ██║\n");
            vga_print("       ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝ ╚═════╝  ╚═════╝ ╚═╝     ╚═╝\n");
            vga_set_color(VGA_CYAN, VGA_BLACK);
            vga_print("             HAZOOM OS v6.0 — The OS That Learns\n");
            vga_set_color(VGA_WHITE, VGA_BLACK);
            pmm_stats_t st = pmm_get_stats();
            uint64_t mem_mb = (st.total_frames * 4096) / (1024 * 1024);
            vga_print("Kernel:       x86_64, Bare Metal\n");
            vga_print("Memory:       "); print_num(mem_mb); vga_print(" MB total\n");
            uint32_t pc = 0;
            PCB_t *cur = process_list_head;
            while (cur) { pc++; cur = cur->next; }
            vga_print("Processes:    "); print_num(pc); vga_print("\n");
            vga_print("Uptime:       "); print_num(system_ticks / 100); vga_print(" seconds\n");
            vga_print("Q-Learning:   Active (tabular, "); print_num(1000); vga_print(" states)\n");
            vga_print("AI Engine:    DeepConsciousness v2.0\n");
            vga_print("Compiler:     GCC (freestanding)\n");
        }
        else if (cmd[0] == 'e' && cmd[1] == 'x' && cmd[2] == 'i' && cmd[3] == 't' && (cmd[4] == '\0' || cmd[4] == ' ')) {
            vga_print("Shutting down...\n");
            __asm__ volatile("cli; hlt");
        }
        else {
            vga_print("Command not found: ");
            vga_print(cmd);
            vga_print("\n");
        }
    }
}

void kernel_main(uint64_t boot_magic, uint64_t boot_info) {
    (void)boot_magic; (void)boot_info;
    vga_set_color(VGA_CYAN, VGA_BLACK);
    vga_clear();
    vga_print("HAZOOM OS v6.0 -- Kernel initialized\n");

    vga_print("[INIT] Loading Global Descriptor Table...\n");
    gdt_init();
    vga_print("[INIT] GDT loaded.\n");

    vga_print("[INIT] Loading Interrupt Descriptor Table...\n");
    idt_init();
    vga_print("[INIT] IDT loaded.\n");

    vga_print("[INIT] Initializing Physical Memory Manager...\n");
    mmap_entry_t default_mmap[2];
    default_mmap[0].base   = 0x200000;
    default_mmap[0].length = 0x1FE00000;
    default_mmap[0].type   = 1;
    default_mmap[0].acpi_ext = 0;
    default_mmap[1].base   = 0;
    default_mmap[1].length = 0;
    default_mmap[1].type   = 0;
    default_mmap[1].acpi_ext = 0;

    pmm_init(default_mmap, 2);
    pmm_stats_t pmm_st = pmm_get_stats();
    vga_print("[INIT] PMM initialized. Total: ");
    print_num(pmm_st.total_frames);
    vga_print(" frames, Free: ");
    print_num(pmm_st.free_frames);
    vga_print("\n");

    vga_print("[INIT] Setting up kernel page tables...\n");
    setup_kernel_page_tables();
    vga_print("[INIT] Virtual memory initialized.\n");

    vga_print("[INIT] Initializing keyboard...\n");
    keyboard_init();

    vga_print("[INIT] Initializing process manager...\n");
    process_init();
    vga_print("[INIT] Process manager ready.\n");

    vga_print("[INIT] Initializing Q-learning subsystem...\n");
    qlearn_init();

    vga_print("[INIT] Enabling interrupts...\n");
    __asm__ volatile("sti");
    vga_print("[INIT] System ready.\n");

    pmm_stats_t st = pmm_get_stats();
    vga_set_color(VGA_GREEN, VGA_BLACK);
    vga_print("\n================================================================\n");
    vga_print("  HAZOOM OS v6.0 - ALL SYSTEMS ONLINE\n");
    vga_print("  Memory: "); print_num((st.total_frames * 4096) / (1024 * 1024)); vga_print(" MB\n");
    vga_print("  Processes: 1 running\n");
    vga_print("  Q-Learning: Active\n");
    vga_print("  Keyboard: Ready\n");
    vga_print("================================================================\n");
    vga_set_color(VGA_WHITE, VGA_BLACK);

    kernel_shell();
}
