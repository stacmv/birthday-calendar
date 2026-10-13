export PR=/mnt/c/Users/Stac/.claude/plugins/cache/hyperframes/hyperframes/0.8.150
S=$PR/skills/product-launch-video/scripts
SD=/mnt/c/Users/Stac/AppData/Local/Temp/claude/D--dev-anniversary-calendar/54140d36-fd86-44ab-88fc-d095f8b20bcd/scratchpad/inv
hf(){ node $PR/skills/hyperframes/scripts/plugin-cli.mjs "$@"; }
cd ~/hf/ac-invitation
cp $SD/0*.html compositions/frames/
sed -i 's/<div id="f4-A" class="f4-abs f4-col" style="top:230px">/&/' compositions/frames/04-export.html
node $S/assemble-index.mjs --storyboard ./STORYBOARD.md --hyperframes . || exit 1
node $S/transitions.mjs inject --storyboard ./STORYBOARD.md --hyperframes . || exit 1
node $S/transitions.mjs verify --storyboard ./STORYBOARD.md --index ./index.html
# variables on <html>
sed -i '0,/<html lang="en">/s//<html lang="en" data-composition-variables='"'"'[{"id":"lang","type":"enum","label":"Language","default":"ru","options":[{"value":"ru","label":"Russian"},{"value":"en","label":"English"}]}]'"'"'>/' index.html
head -5 index.html
