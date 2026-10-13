export PR=/mnt/c/Users/Stac/.claude/plugins/cache/hyperframes/hyperframes/0.8.150
SD=/mnt/c/Users/Stac/AppData/Local/Temp/claude/D--dev-anniversary-calendar/54140d36-fd86-44ab-88fc-d095f8b20bcd/scratchpad/inv
bash $SD/build.sh >/dev/null 2>&1
cd ~/hf/ac-invitation
sed -i 's#<head>#<head><script>window.__hfVariables={"lang":"en"};</script>#' index.html
timeout 400 node $PR/skills/hyperframes/scripts/plugin-cli.mjs snapshot --no-end --at 1.0,9.5,12.5,20,23,30,33,38,45,51,53,59 2>&1 | tail -2
