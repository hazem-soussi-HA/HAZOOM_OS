#!/bin/bash
cd ~/pascal_encrypted
echo "👀 Hazoom Watcher est prêt. Modifiez 'hazoom.pas' pour voir le changement."
ls hazoom.pas | entr -c sh -c "fpc hazoom.pas && ./hazoom"
