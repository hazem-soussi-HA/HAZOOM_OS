{$mode objfpc}{$H+}
program HazoomWeb;
uses winsock2, sysutils;

const PORT = 8090;

function GetSyncData: string;
var f: text; line, combined: string;
begin
  combined := '';
  if FileExists('sync_state.json') then begin
    AssignFile(f, 'sync_state.json'); Reset(f);
    while not Eof(f) do begin Readln(f, line); combined := combined + line; end;
    CloseFile(f);
  end;
  if combined = '' then combined := '{}';
  GetSyncData := combined;
end;

procedure StartServer;
var
  WSAData: TWSAData; S, ClientS: TSocket; Addr, ClientAddr: TSockAddrIn;
  AddrLen: Integer; Buffer: array[0..2048] of char;
  Response, Data, HTML: string;
begin
  WSAStartup($0202, WSAData);
  S := socket(AF_INET, SOCK_STREAM, IPPROTO_TCP);
  Addr.sin_family := AF_INET; Addr.sin_port := htons(PORT); Addr.sin_addr.s_addr := INADDR_ANY;
  if bind(S, @Addr, sizeof(Addr)) <> 0 then exit;
  listen(S, 5);
  writeln('?? HAZOOM GLOBAL NOC ONLINE: http://localhost:', PORT);

  while True do begin
    AddrLen := sizeof(ClientAddr);
    ClientS := accept(S, @ClientAddr, @AddrLen);
    if ClientS <> INVALID_SOCKET then begin
      recv(ClientS, Buffer, sizeof(Buffer), 0);
      Data := GetSyncData;
      
      HTML := '<html><head><title>HAZOOM NOC</title>' +
              '<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />' +
              '<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>' +
              '<style>' +
              '  body { background: #050505; color: #bc00ff; font-family: "Courier New"; margin: 0; overflow: hidden; }' +
              '  #map { height: 70vh; width: 100%; border-bottom: 2px solid #bc00ff; box-shadow: 0 0 20px #bc00ff; }' +
              '  .console { padding: 20px; height: 30vh; background: #000; font-size: 0.9em; }' +
              '  .glitch { color: #00ff41; text-shadow: 0 0 5px #00ff41; }' +
              '</style></head><body>' +
              '<div id="map"></div>' +
              '<div class="console">' +
              '  <h2 class="glitch">? HAZOOM v3.1 - NEURAL WORLD TRACKER</h2>' +
              '  <pre id="telemetry">' + Data + '</pre>' +
              '</div>' +
              '<script>' +
              '  var data = ' + Data + ';' +
              '  var map = L.map("map").setView([data.lat || 0, data.lon || 0], 4);' +
              '  L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png").addTo(map);' +
              '  L.circle([data.lat, data.lon], {color: "#bc00ff", fillOpacity: 0.5, radius: 500000}).addTo(map)' +
              '   .bindPopup("<b>HAZOOM NODE</b><br>Status: Active").openPopup();' +
              '  setTimeout(function(){ location.reload(); }, 15000);' +
              '</script></body></html>';

      Response := 'HTTP/1.1 200 OK' + #13#10 + 'Content-Type: text/html' + #13#10 + 'Connection: close' + #13#10#13#10 + HTML;
      send(ClientS, Response[1], Length(Response), 0);
      closesocket(ClientS);
    end;
  end;
end;

begin
  StartServer;
end.
