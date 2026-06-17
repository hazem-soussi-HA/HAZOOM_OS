program GalaxyServer;

{$mode objfpc}{$H+}

uses
  cthreads, // THE FIRST STAR: Essential for Linux threading
  SysUtils, Classes, fphttpserver, httpdefs;

type
  TGalaxyHandler = class
    procedure HandleRequest(Sender: TObject; var ARequest: TFPHTTPConnectionRequest; 
                           var AResponse: TFPHTTPConnectionResponse);
  end;

procedure TGalaxyHandler.HandleRequest(Sender: TObject; var ARequest: TFPHTTPConnectionRequest; 
                                      var AResponse: TFPHTTPConnectionResponse);
begin
  WriteLn('[KERNEL] Incoming connection from: ', ARequest.RemoteAddress);
  try
    AResponse.ContentType := 'text/html';
    // Load the "Stars" index we generated earlier
    AResponse.Contents.LoadFromFile('index.html');
    AResponse.SendContent;
  except
    on E: Exception do
    begin
       AResponse.Code := 500;
       AResponse.Content := '<h1>Cosmic Collapse</h1>' + E.Message;
       AResponse.SendContent;
    end;
  end;
end;

var
  Server: TFPHTTPServer;
  Handler: TGalaxyHandler;
begin
  Server := TFPHTTPServer.Create(nil);
  Handler := TGalaxyHandler.Create;
  try
    Server.Port := 8080;
    Server.Threaded := True; 
    Server.OnRequest := @Handler.HandleRequest;
    
    WriteLn('--- AlphaPony Pascal Web Engine : ONLINE ---');
    WriteLn('The Galaxy is radiating at http://localhost:8080');
    
    Server.Active := True;
  finally
    Server.Free;
    Handler.Free;
  end;
end.
