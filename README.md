# MooMoo.js

This is a simple bot API for MooMoo.io.

Note that this is **not** an AI library, only the endpoint.

## Installation

Do `npm install -s moomoo.js` to install with NPM.

## Organization

The structure of a simple multiboxing bot can be as follow:

    Moo 1
    ├─┬ ThingManager 1
    │ ├── Thing 1
    │ ├── Thing 2
    │ └── Thing 3
    ├─┬ PlayerManager 1
    │ ├── Player 1
    │ ├── Player 2
    │ └── Player 3
    ├── LBs
    ├── Alliances
    ├─┬ Conn 1
    │ └─┬ Interface 1
    │   ├── Player 1
    │   └── Inputs 1
    └─┬ Conn 2
      └─┬ Interface 2
        ├── Player 2
        └── Inputs 2

|Name|Per/Multi|About
|-|-|-
|Moo|per IP|Used for each server / IP
|Thing Manager|per `Moo`|Aka TM - Used to control things
|Thing|multi per `TM`|A, well, thing
|Player Manager|per `Moo`|Aka PM - Used to control players
|Player|multi per `PM`|An unknown player
|LBs|per `Moo`|Leaderboard manager
|Alliances|per `Moo`|Alliance "manager"
|Conn|multi per `Moo`|A simple socket connection
|Interface|per `Conn`|An advanced socket to attach events onto
|Inputs|per `Interface`|A class to control the inputs and let you move

## Documentation

To gain access of the library, you first must need to install it, and then use `require("moomoo.js")` to get the main module.

A sample bot is below:

    var moo = require("moomoo.js");
    var bot = moo("52.89.68.23");
    bot.create("Bot", {
      spawn: "re",
    }).on("identify", con => {
      console.log("Identified!");
      con.spawn().then(me => {
        console.log(`I'm at ${me.x}, ${me.y}`);
        if (bot.als.exists("BOT")) {
          con.join("BOT");
        } else {
          con.create("BOT").then(r => {
            r.on("ask", u => {
              if (u.name == "Bot") {
                con.accept(u);
              } else {
                con.reject(u);
              }
            });
          });
        }
      });
    });