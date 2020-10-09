#!/bin/bash
for fname in $(ls)
do
	if  [ "$fname" != "script.sh" ];
	then
		name=$(echo $fname | cut -c1-4)
		mkdir $name
		cd $name
		bzip2 -d ../$fname
		cd ..
	fi
done

