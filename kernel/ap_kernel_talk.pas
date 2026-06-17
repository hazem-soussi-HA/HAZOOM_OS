program KernelTalk;

{$mode objfpc}{$H+}

uses
  BaseUnix; // The unit you saw in your Galaxy!

var
  PID: TPid;
  UID: TUid;
begin
  // Talking to the Kernel
  PID := fpGetPid;
  UID := fpGetUid;

  WriteLn('--- Accessing the Unix Kernel via Pascal ---');
  WriteLn('Current Process ID (PID): ', PID);
  WriteLn('Current User ID (UID)   : ', UID);
  
  if UID = 0 then
    WriteLn('Status: You are running as ROOT (The God of the System).')
  else
    WriteLn('Status: You are a standard User Nebula.');
    
  WriteLn('--------------------------------------------');
end.
