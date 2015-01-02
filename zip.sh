#!/bin/bash
#
#   Pack into zip and copy to sdcard for CocoonJS Player
#
cd build/web
zip -r ../../tictactoe.zip .
cd ..
cd ..
adb push tictactoe.zip /sdcard/tictactoe.zip
