(() => {
  /** Inxports **/
  "use strict";
  var $ = module.exports = exports = (a, b, c) => new $.moo(a, b, c);
  var io = require("socket.io-client");
  var ee = require("events");
  
  /** Constants **/
  var PI = Math.PI;
  
  /** Classes **/
  var Moo = $.moo = class extends ee {
    constructor(ip, n, c) {
      super();
      this.ip = ip;
      this.conns = [];
      this.lbs = new LBs(this);
      this.pms = new PlayerManager(this);
      this.tms = new ThingManager(this);
      this.als = new Alliances(this);
      this.spn = 0 | (Math.random() * 11);
      if (n) {
        this.connect(n, c);
      }
      setInterval(() => super.emit("frame"), 33);
    }
    connect(o, n) {
      if (o + "" == "[object Array]") {
        n = o; o = n.length;
      } else if (!n || !n.length || n + "" != "[object Array]") {
        n = [n || o || ""];
      }
      for (var i = 0; i < o; i++) {
        this.create(n[i % n.length]);
      }
    }
    create(n, o) {
      if (!o) { o = typeof n == "object" ? n : {}; }
      o.name = typeof n == "string" && n; 
      var x = new Conn(this, o);
      this.conns.push(x);
      return x;
    }
  };
  var Conn = $.conn = class extends ee {
    constructor(m, o) {
      super();
      this.moo = m;
      this.inf = null;
      this.id = m.spn++;
      this.opt = o;
      this.socket = {};
      if (o.nautocon) { return; }
      this.connect();
    }
    connect() {
      var m = this.moo;
      var sk = this.socket = io.connect(`http://${m.ip}:${5000+(this.id % 11)}`, {
        reconnection: false,
        query: "man=1"
      });
      sk.on("disconnect", () => super.emit("disconnect"));
      sk.on("connect", () => {
        super.emit("connect", sk);
        m.lbs.listen(sk, this.id);
        m.pms.listen(sk, this.id);
        m.tms.listen(sk, this.id);
        m.als.listen(sk, this.id);
        this.inf = new Interface(this, this.opt);
      });
    }
  };
  var Inputs = $.inputs = class {
    constructor(p) {
      this.socket = p.conn.socket;
      this.mouse = false;
      this.louse = false;
      this.aim = 0;
      this.keys = {};
      this.leys = {};
    }
    start(x) { this.keys[x] = 1; }
    stop(x) { this.keys[x] = 0; }
    hold() { this.mouse = 1; }
    reset() { for (var i in this.keys) { this.keys[i] = 0; } }
    release() { this.mouse = 0; }
    frame() {
      var sk = this.socket, k = this.keys, l = this.leys;
      if (this.mouse != this.louse) {
        sk.emit("4", this.louse = this.mouse);
      }
      for (var i in k) {
        if (k[i] == l[i]) { continue; }
        sk.emit("3", i, l[i] = k[i]);
      }
      sk.emit("2", this.aim = ((this.aim + PI) % (2 * PI)) - PI);
    }
  };
  var LBs = $.lbs = class extends ee {
    constructor(moo) {
      super();
      this.moo = moo;
      this.top = [{}, {}, {}, {}, {}, {}, {}, {}, {}, {}];
    }
    update(data) {
      var c = this.top;
      var t = this.top = [];
      for (var i = 0; i < 30; i += 3) {
        var m = { sid: data[i], name: data[i+1], score: data[i+2] };
        //this.moo.pms.update(m);
        t.push(m);
      }
      for (var i = 0; i < 10; i++) {
        if (c[i].sid !== t[i].sid) {
          super.emit("shuffle", t);
        }
      }
      super.emit("update", t);
    }
    listen(sk) {
      sk.on("5", a => this.update(a));
    }
  };
  var Thing = $.thing = class {};
  var ThingManager = $.thing.manager = class {
    constructor(moo) {
      
    }
    add(a) {
      
    }
    remove(a) {
      
    }
    kilall(a) {
      
    }
    listen(sk) {
      sk.on( "6", a => this.add(a));
      sk.on("12", a => this.remove(a));
      sk.on("13", a => this.kilall(a));
    }
  };
  var Player = $.player = class {
    constructor(pms, c, a, z) {
      this.pms = pms;
      this.id = a[0];
      this.sid = a[1];
      this.name = a[2];
      this.x = a[3];
      this.y = a[4];
      this.score = null;
      this.alliance = null;
      this.visible = [];
      this.visible[c] = true;
      this.ctrlable = z;
    }
    update(o, x, y) {
      this.x = x;
      this.y = y;
      this.visible[o] = true;
    }
  };
  var PlayerManager = $.player.manager = class extends ee {
    constructor(moo) {
      super();
      this.moo = moo;
      this.bsids = {};
      this.bids = {};
    }
    add(a, o, k) {
      var r = this.bids[a[0]];
      if (r) {
        r.visible[o] = true;
        if (k) {
          r.ctrlable = true;
          super.emit("ctrler", r);
        }
        return;
      }
      if (k) {
        r = this.bids[a[0]] = this.bsids[a[1]] = new Player(this, o, a, true);
        super.emit("ctrler", r);
      }
      return this.bids[a[0]] = this.bsids[a[1]] = new Player(this, o, a);
    }
    update(a, o) {
      for (var i in this.bsids) { this.bsids[i].visible[o] = false; }
      for (var d = 0; d < a.length; d += 8) {
        this.bsids[a[d]].update(o, a[d+1], a[d+2]);
      }
    }
    remove(a) {
      var p = this.bids[a];
      if (!p) { return; }
      this.bids[p.id] = null;
      this.bsids[p.sid] = null;
    }
    listen(sk, o) {
      sk.on("2", (a, s) => this.add(a, o, s));
      sk.on("3", a => this.update(a, o));
      sk.on("4", a => this.remove(a));
    }
  };
  var Interface = $.interface = class extends ee {
    constructor(c, o) {
      super();
      this.opt = o;
      this.conn = c;
      this.moo = c.moo;
      this.io = new Inputs(this);
      this.ctrl = null;
      this.sid = null;
      this.socket = c.socket;
      this.track();
    }
    track() {
      var sk = this.socket;
      sk.on("id", () => {
        this.conn.emit("identify", this);
      });
      sk.on("1", sid => {
        if (!this.sid) {
          this.moo.pms.on("ctrler", r => {
            if (r.sid != sid) {
              console.log(r);
              console.log(sid);
              return;
            }
            console.log("Good");
            super.emit("spawn", r);
          });
        }
        this.id = sid;
      });
    }
    spawn(name) {
      this.socket.emit("1", name || this.opt.name);
      return new Promise((accept) => {
        super.on("spawn", r => accept(r));
      });
    }
    join() {}
    create() {}
  };
  var Alliances = $.alliances = class {
    constructor(moo) {
      this.moo = moo;
      this.all = [];
    }
    exist(id) { return this.all[id]; }
    add(id) { this.all[id] = true; }
    remove(id) { delete this.all[id]; }
    listen(sk) {
      sk.on("ac", a => this.add(a));
      sk.on("ad", a => this.remove(a));
      /*sk.on("an", allianceNotification);
      sk.on("st", setPlayerTeam);
      sk.on("sa", setAlliancePlayers);*/
    }
  };
})();

/*var socket = io.connect(`http://34.208.142.157:5001`, { reconnection: false, query: "man=1" });
socket.on("11", () => {
  socket.emit("1", { name: "Host" });
});
socket.once("connect", () => {
  console.log("Connected!");
  setInterval(() => socket.emit("2", 0), 33);
  socket.emit("1", { name: "Host" });
  socket.emit("8", "CX");
});
socket.on("an", a => {
  socket.emit("11", a, 1);
});*/
