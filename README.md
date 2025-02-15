LinuxNAS
========

This is a simple Linux NAS script that makes it possible for everyone to have the best home network solutions. It uses open source linux apps under one interface.
##Minimum system requirements:<br>
• Supported OS: Ubuntu (14.04) 64bit;<br>
•	Processor: 1 GHz (for the virtualization needs VT-x);<br>
•	RAM: 512 MB; <br>
•	Hard disk space: 15 GB <br>
Recommendation: you should use a fresh install of any of the above supported OS, they should be minimal install and have internet connection.

###Feautures: <br>
• Web Server<br>
• Torrent manager<br>
• Local network shared space<br>
• Virtualization (optional)<br>
• Plex Media Server
Explanation: you can download and manage all your torrents from a web interface, immediately after download you can play/stream any movie on you TV, PC, Laptop, Tablet, Phone via the local network. Optionally you can manage virtual machine via the web Browser (Mozilla Firefox, Chrome, Internet explorer, etc). You can use the Web Interface via the internet so that you can start downloading you favorite movie even before you get home. 

##How to install (only 5 minutes):<br>
Run the folowing commands
```
sudo -i
wget https://github.com/giumbai/LinuxNAS/archive/master.zip && apt-get install unzip && unzip master.zip && cd LinuxNAS-master/Stable/Stable_1.1 && bash installer.sh
```
And this is all! For more detalies in how to set up go to our Docs page (http://linuxnas.readthedocs.org/en/Documents/).

### What features i will implement in the next version!
* File Manager <br>
* Owncloud <br>
* XBMC <br>
* PowerOff option from Web Interface <br>
* A better web interface <br>
* Console script for the web interface

### Credits
• Utorrent (http://www.utorrent.com/)
• Foundation (https://github.com/zurb/foundation)
• PlexMediaServer (https://plex.tv/)
• Ubuntu (http://www.ubuntu.com/server)
