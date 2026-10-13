P=/mnt/c/Users/Stac/.claude/plugins/cache/hyperframes/hyperframes/0.8.150
HF="node $P/skills/hyperframes/scripts/plugin-cli.mjs"
cd ~/hf/ac-newspaper
$HF render --quality high --workers 2 --variables '{"lang":"ru"}' --output renders/ru.mp4 > /tmp/np-ru.log 2>&1
$HF render --quality high --workers 2 --variables '{"lang":"en"}' --output renders/en.mp4 > /tmp/np-en.log 2>&1
echo done > /tmp/np-done
