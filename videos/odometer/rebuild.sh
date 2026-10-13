#!/bin/bash
# rebuild frames, reassemble index, inject transitions, patch lang variable
PR=/mnt/c/Users/Stac/.claude/plugins/cache/hyperframes/hyperframes/0.8.150
HF="node $PR/skills/hyperframes/scripts/plugin-cli.mjs"; S="$HF --script $PR/skills/product-launch-video/scripts"
cd ~/hf/ac-odometer && node src/build-frames.mjs >/dev/null && $S/assemble-index.mjs --storyboard ./STORYBOARD.md --hyperframes . >/dev/null && $S/transitions.mjs inject --storyboard ./STORYBOARD.md --hyperframes . >/dev/null
sed -i "s#<html lang=\"en\">#<html lang=\"en\" data-composition-variables='[{\"id\":\"lang\",\"type\":\"enum\",\"label\":\"Language\",\"default\":\"ru\",\"options\":[{\"value\":\"ru\",\"label\":\"RU\"},{\"value\":\"en\",\"label\":\"EN\"}]}]'>#" index.html
head -2 index.html | tail -1 | cut -c1-60
