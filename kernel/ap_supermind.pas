program SuperMind;
{$mode objfpc}{$H+}
uses cthreads, BaseUnix, SysUtils, Classes, fphttpserver, httpdefs;
type
  TSynapseServer = class(TFPHttpServer)
    procedure DoRequest(Sender: TObject; var ARequest: TRequest; var AResponse: TResponse); override;
  end;
procedure TSynapseServer.DoRequest(Sender: TObject; var ARequest: TRequest; var AResponse: TResponse);
begin
  if ARequest.URI = '/status' then begin
    AResponse.ContentType := 'application/json';
    AResponse.Content := '{"status": "ACTIVE", "kernel": "LINUX_WSL", "time": "' + DateTimeToStr(Now) + '"}';
  end else begin
    AResponse.ContentType := 'text/html';
    AResponse.Contents.LoadFromFile('index.html');
  end;
  AResponse.SendContent;
end;
var Server: TSynapseServer;
begin
  Server := TSynapseServer.Create(nil);
  try
    Server.Port := 8080; Server.Threaded := True;
    WriteLn('--- BRAIN ONLINE : PORT 8080 ---');
    Server.Active := True;
  finally Server.Free; end;
end.
