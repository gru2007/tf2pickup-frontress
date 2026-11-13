_Last updated: 13 November 2026._

This policy covers the Team Frontress game, its game coordinator (the service that runs matchmaking), our game servers, our crash report server and this website. Team Frontress is run by Ruslan Artemev, person.

## Signing in through Steam

The game and this website know you by your Steam account. When the game connects to the coordinator, Steam gives it a one-time ticket that proves your SteamID64; we never see your Steam password. Signing in to this website goes through Steam's own sign-in page and tells us only your SteamID64. We get your public Steam name and avatar from Steam.

## Matchmaking

To run matches the coordinator keeps, by your SteamID64:

- the name your game reported and your match results: score, kills, damage, healing, classes, XP, quests, rewards and the rating used to balance teams;
- your parties, queues, clan and war side, and the matches you played in, joined and left (abandons count against you);
- the region you picked and the ping your game measured to our servers, while you are online;
- reports you sent and reports about you, with the reason, the match, the map and any comment you wrote;
- donations and subscriptions you made through Steam, if any: the order, amount, currency and status. Steam handles the payment; we never see your card or bank details.

For moderation the coordinator also keeps a log for 30 days: when your game connected and from which IP address, your parties and searches, the matches you joined and left, and what you wrote in the menu's chat.

## Game servers

When you play on our servers, the server sees your IP address, SteamID, name, what you say in chat and what you do in the match. It keeps the usual Source server logs of this for up to 30 days.

## Easy Anti-Cheat

Our matches are protected by Easy Anti-Cheat, made by Epic Games. It runs with the game on Windows and collects information about your computer and the software running on it to detect cheating. Epic handles that data under its own [privacy policy](https://www.epicgames.com/site/en-US/privacypolicy).

From Easy Anti-Cheat we keep your Epic product user ID, when it last verified your game, what it reported about your sessions (the reason, the server and the match), and any ban that followed. Reports you send in the game can also go to Epic's player report service. We may issue a Steam game ban for cheating, which Valve then records on your Steam account.

## Crash reports

When the game or one of our servers crashes or stops with an error, it sends a crash report to our own crash report server at crash.team-frontress.org. It runs [Bugsink](https://www.bugsink.com) on our machine; reports do not go to any other company. If the game cannot send a report at once, it keeps it in the `crashreports` folder next to the game and sends it on the next launch.

A report contains:

- a minidump: a copy of part of the crashed game's memory at the moment of the crash. It can include anything the game had in memory, such as names of players on the server, chat lines and server addresses;
- the last ~64 KB of the game's console output, which shows the same kind of things you see in the console;
- your SteamID64;
- the IP address the report came from;
- your operating system's name and version;
- the list of modules (DLLs and libraries) the game had loaded, with their file paths. A path can include your Windows or macOS user name, for example `C:\Users\<name>\...`;
- the game version and whether it was the game or a server that crashed.

A report is also sent when the game ended without a clean exit the last time (for example, it froze or was closed from the task manager). That report has the console output of that session, but no minidump.

We use crash reports only to find and fix crashes.

### Turning crash reports off

Start the game with the launch option `-nosentry`: in Steam, right-click the game, choose **Properties**, and add `-nosentry` to **Launch options**. The game then sends no crash reports and keeps no console copy for them. Reports already waiting in the `crashreports` folder stay there unsent; delete the folder to remove them.

## This website

This website keeps nothing of its own. It stores your SteamID64, Steam name and avatar in an encrypted cookie in your browser for up to a week. Everything else it shows comes from the coordinator at the moment you open a page. Like any web server it logs requests, with your IP address, for up to 30 days. Avatars are loaded from Steam and map pictures from mapthumbnails.tf2pickup.org, so those services see your IP address when you open a page. The site uses no analytics or advertising.

## Discord

If Discord is running, the game shows what you are playing in your Discord status and lets friends join your party. This goes through the Discord app on your computer, and Discord handles it under its own policy.

## Who sees it

- Your profile, your match history and the scoreboards of your matches are public. Match results may also be sent to community projects we connect, such as Discord bots and stats sites.
- Your bans, quests and donations are shown only to you and to the staff.
- Reports are shown only to the staff and never tell the reported player who reported them.
- The coordinator's log and the game server logs are seen only by the staff.
- Crash reports are seen only by the developers who have an account on our crash report server.

We do not sell your data or share it with anyone else, except where the law requires it.

## How long we keep it

- The coordinator's log: 30 days.
- Your account, match history, reports, bans and Easy Anti-Cheat records: as long as the game runs, or until you ask us to delete them. A ban and the records behind it are kept while the ban lasts.
- Donation records: as long as Steam and tax rules require.
- Crash reports: 30 days.
- Game server and website logs: as stated above.

## Your choices

You can see your own account on your profile here. To get a copy of your data, correct it or have it deleted, contact us at contact@team-frontress.org 
You can also reach the people listed on the [staff page](/staff).
