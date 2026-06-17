program CosmicPortal;
{$mode objfpc}{$H+}
uses SysUtils, Classes;

const
  SOURCE_DIR = '/mnt/c/FPC/3.0.4/source/rtl/unix';
  OUTPUT_FILE = 'index.html';

function EscapeHTML(S: string): string;
begin
  Result := StringReplace(S, '&', '&amp;', [rfReplaceAll]);
  Result := StringReplace(Result, '<', '&lt;', [rfReplaceAll]);
  Result := StringReplace(Result, '>', '&gt;', [rfReplaceAll]);
end;

procedure BuildGalaxy;
var
  Info: TSearchRec;
  SL, FileContent: TStringList;
  SafeId: string;
begin
  SL := TStringList.Create; FileContent := TStringList.Create;
  try
    SL.Add('<!DOCTYPE html><html><head><title>AlphaPony Conscious Galaxy</title>');
    SL.Add('<style>');
    SL.Add('  body { background: #050508; color: white; font-family: "Segoe UI", sans-serif; margin: 0; overflow: hidden; }');
    SL.Add('  body { background-image: radial-gradient(white, rgba(255,255,255,.2) 2px, transparent 40px); background-size: 550px 550px; }');
    SL.Add('  .galaxy { display: flex; flex-wrap: wrap; gap: 20px; padding: 50px; justify-content: center; height: 100vh; overflow-y: auto; z-index: 1; position: relative; }');
    SL.Add('  .star { background: rgba(255,255,255,0.05); border: 1px solid #00f2ff; border-radius: 15px; padding: 20px; width: 280px; backdrop-filter: blur(10px); transition: all 0.5s ease; cursor: pointer; }');
    SL.Add('  .star:hover { transform: scale(1.05); border-color: #ffcf00; }');
    SL.Add('  .filename { color: #ffcf00; font-family: monospace; font-weight: bold; }');
    SL.Add('  #overlay { display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.95); z-index:100; padding:40px; box-sizing:border-box; }');
    SL.Add('  #content-wrapper { height: 80vh; overflow-y: auto; border: 1px solid #00f2ff; border-radius: 10px; background: #000; padding: 10px; }');
    SL.Add('  pre { color: #33ff33; font-family: "Consolas", monospace; font-size: 14px; line-height: 1.5; white-space: pre; margin: 0; }');
    SL.Add('  h1 { transition: all 0.5s ease; text-shadow: 0 0 10px #00f2ff; }');
    SL.Add('</style>');
    
    // THE CONSCIOUS SCRIPT INJECTION
    SL.Add('<script>');
    SL.Add('  function show(id){ document.getElementById("overlay").style.display="block"; document.getElementById("content").innerHTML = document.getElementById(id).innerHTML; }');
    SL.Add('  function hide(){ document.getElementById("overlay").style.display="none"; }');
    SL.Add('  async function awaken() {');
    SL.Add('      setInterval(async () => {');
    SL.Add('          try {');
    SL.Add('              const res = await fetch("/status");');
    SL.Add('              const data = await res.json();');
    SL.Add('              document.querySelector("h1").innerText = "NEURAL STATE: " + data.status + " | UPTIME: " + data.uptime;');
    SL.Add('              let stars = document.querySelectorAll(".star");');
    SL.Add('              let randomStar = stars[Math.floor(Math.random()*stars.length)];');
    SL.Add('              randomStar.style.boxShadow = "0 0 50px #ffcf00";');
    SL.Add('              randomStar.style.borderColor = "#ffcf00";');
    SL.Add('              setTimeout(() => { randomStar.style.boxShadow = "none"; randomStar.style.borderColor = "#00f2ff"; }, 800);');
    SL.Add('          } catch(e) { console.log("Waiting for Pascal Mind..."); }');
    SL.Add('      }, 2000);');
    SL.Add('  }');
    SL.Add('  window.onload = awaken;');
    SL.Add('</script></head><body>');
    
    SL.Add('<div class="galaxy">');
    SL.Add('<h1 style="width:100%; text-align:center; color:#00f2ff;">PASCAL SOURCE NEBULA</h1>');

    if FindFirst(SOURCE_DIR + '/*', faAnyFile, Info) = 0 then begin
      repeat
        if (Info.Attr and faDirectory = 0) and ((Pos('.pp', Info.Name) > 0) or (Pos('.inc', Info.Name) > 0)) then begin
          SafeId := StringReplace(Info.Name, '.', '_', [rfReplaceAll]);
          SL.Add('<div class="star" onclick="show(''' + SafeId + ''')"><div class="filename">' + Info.Name + '</div></div>');
          FileContent.LoadFromFile(SOURCE_DIR + '/' + Info.Name);
          SL.Add('<div id="' + SafeId + '" style="display:none;"><pre>' + EscapeHTML(FileContent.Text) + '</pre></div>');
        end;
      until FindNext(Info) <> 0;
      FindClose(Info);
    end;

    SL.Add('</div><div id="overlay"><span onclick="hide()" style="cursor:pointer; color:red; float:right; font-size:2em;">&times; Close</span>');
    SL.Add('<h2 style="color:#ffcf00;">Neural Core Access</h2><div id="content-wrapper"><div id="content"></div></div></div>');
    SL.Add('</body></html>');
    SL.SaveToFile(OUTPUT_FILE);
  finally
    SL.Free; FileContent.Free;
  end;
end;

begin
  BuildGalaxy;
end.
