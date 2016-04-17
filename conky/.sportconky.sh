#!/bin/bash
python ~/.espn_api.py|cut -d',' -f2-7 --output-delimiter=' ' |sed 's/\[//g' |sed 's/\]//g'| tr -d \'\" | sed '/^(400/d' | sed 's/)//3'
