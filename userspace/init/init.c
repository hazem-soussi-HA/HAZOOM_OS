#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <fcntl.h>

int main(int argc, char **argv) {
    printf("HAZOOM OS v6.0 - Init System\n");
    printf("PID 1 starting...\n");
    
    mount_proc();
    mount_dev();
    
    start_services();
    
    printf("HAZOOM Shell ready.\n");
    
    char line[256];
    while (1) {
        printf("hazem@hazoom:~$ "), fflush(stdout);
        if (!fgets(line, sizeof(line), stdin)) continue;
        line[strlen(line)-1] = 0;
        if (strcmp(line, "exit") == 0 || strcmp(line, "logout") == 0) break;
        if (strcmp(line, "help") == 0) {
            printf("Available commands: help, exit, ls, cat, ps, mem\n");
        } else {
            printf("Unknown command: %s\n", line);
        }
    }
    
    return 0;
}