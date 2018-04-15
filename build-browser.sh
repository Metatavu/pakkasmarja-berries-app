#!/bin/sh

cordova plugin remove cordova-plugin-photo-library
cordova build browser
cordova plugin add cordova-plugin-photo-library --force --variable PHOTO_LIBRARY_USAGE_DESCRIPTION="To choose photos"