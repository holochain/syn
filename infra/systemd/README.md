To install, cd to this directory and:

```sh
sudo ln -sf `pwd`/syn.service /etc/systemd/system/syn.service
```

After changing, reload and start:

```sh
sudo systemctl daemon-reload
sudo systemctl start syn.service
sudo systemctl status syn.service
```

To see full logs of this service:

```sh
journalctl -u syn.service
```
