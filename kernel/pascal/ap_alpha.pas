program AlphaPonySentinel;
uses windows, sysutils;
const RESET=#27'[0m'; GREEN=#27'[32m'; BLUE=#27'[34m'; PURPLE=#27'[35m'; WHITE=#27'[37m'; BOLD=#27'[1m';

procedure Clear;
var hOut: THandle; scbi: TConsoleScreenBufferInfo; dw: DWORD; origin: TCoord;
begin
  hOut := GetStdHandle(STD_OUTPUT_HANDLE);
  GetConsoleScreenBufferInfo(hOut, scbi);
  dw := scbi.dwSize.X * scbi.dwSize.Y;
  origin.X := 0; origin.Y := 0;
  FillConsoleOutputCharacter(hOut, ' ', dw, origin, dw);
  SetConsoleCursorPosition(hOut, origin);
end;

begin
  while true do begin
    Clear;
    writeln(BOLD + PURPLE + '   >>> ALPHA PONY - COMMAND CENTER v2.2.0 <<<' + RESET);
    writeln('   ----------------------------------------');
    writeln(BOLD + '   GMAIL BRIDGE : ' + RESET + GREEN + 'ACTIVE');
    writeln(BOLD + '   TUNNEL       : ' + RESET + BLUE + 'ENCRYPTED SSL/TLS');
    writeln('   ----------------------------------------');
    writeln(BOLD + '   [SYSTEM LOGS]');
    writeln('     ' + WHITE + '>> Messenger Core: Online');
    writeln('     ' + WHITE + '>> Security: Environment Vault Sealed');
    Sleep(2000);
  end;
end.
