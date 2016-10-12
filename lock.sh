#!/bin/bash
scrot /tmp/screen.png
convert /tmp/screen.png -scale 10% -scale 1000% /tmp/screen.png
[[ -f $HOME/.files/lock.png ]] && convert /tmp/screen.png $HOME/.files/lock.png -gravity center -composite -matte /tmp/screen.png
#dbus-send --print-reply --dest=org.mpris.MediaPlayer2.spotify /org/mpris/MediaPlayer2 org.mpris.MediaPlayer2.Player.Stop
i3lock -ui /tmp/screen.png && sleep 2 && xset dpms force standby
