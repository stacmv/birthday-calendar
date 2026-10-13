export PR=/mnt/c/Users/Stac/.claude/plugins/cache/hyperframes/hyperframes/0.8.150
cd ~/hf/ac-invitation; rm -rf renders; mkdir -p renders; node $PR/skills/product-launch-video/scripts/transitions.mjs verify --storyboard ./STORYBOARD.md --index ./index.html
hf(){ node $PR/skills/hyperframes/scripts/plugin-cli.mjs "$@"; }
hf check 2>&1 | tail -25
hf render --quality high --workers 2 --variables '{"lang":"en"}' --output renders/en.mp4 2>&1 | tail -6
ffmpeg -loglevel error -y -i renders/en.mp4 -vf "select='eq(n\,30)+eq(n\,75)+eq(n\,200)+eq(n\,330)+eq(n\,390)+eq(n\,500)+eq(n\,640)+eq(n\,800)+eq(n\,950)+eq(n\,1100)+eq(n\,1250)+eq(n\,1400)+eq(n\,1560)+eq(n\,1700)+eq(n\,1810)',scale=360:-1,tile=5x3" -vsync 0 -frames:v 1 renders/en-sheet.jpg
echo EN-DONE
hf render --quality high --workers 2 --variables '{"lang":"ru"}' --output renders/ru.mp4 2>&1 | tail -6
ffmpeg -loglevel error -y -i renders/ru.mp4 -vf "select='eq(n\,30)+eq(n\,75)+eq(n\,200)+eq(n\,330)+eq(n\,390)+eq(n\,500)+eq(n\,640)+eq(n\,800)+eq(n\,950)+eq(n\,1100)+eq(n\,1250)+eq(n\,1400)+eq(n\,1560)+eq(n\,1700)+eq(n\,1810)',scale=360:-1,tile=5x3" -vsync 0 -frames:v 1 renders/ru-sheet.jpg
for l in ru en; do ffprobe -v error -show_entries stream=codec_type,width,height,duration -of compact renders/$l.mp4; done
echo ALL-DONE
