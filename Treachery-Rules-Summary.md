# Treachery (MTG Variant) - Current Rules Summary

This is a practical summary of the **current** Treachery Comprehensive Rules from:
- https://mtgtreachery.net/rules/cr/
- PDF link: https://mtgtreachery.net/rules/Treachery%20Rules.pdf

Notes:
- This is a **player-friendly summary**, not a replacement for the full comprehensive text.
- The rules site shows updates in May 2026.

## 1. What Treachery Is

Treachery is a multiplayer MTG variant that adds a hidden-role system using **Identity cards** in the command zone.

- Uses normal MTG rules unless Treachery-specific rules override them.
- Designed for **4+ players** (best with 5-6).
- Commonly played with Commander.

## 2. Identity Cards and Roles

Identity cards are a special card type used only in this variant.

Core role types:
- **Leader**
- **Guardian**
- **Assassin**
- **Traitor**

Identity behavior:
- Identity cards stay in the **command zone** for the whole game.
- They are not cast and are not part of your deck.
- Face-up identities have active static/triggered/activated abilities.
- Face-down identities have no characteristics until revealed.

## 3. Team Structure

Teams are defined by revealed identities:

- **Leader team**: Leader + all Guardians.
- **Assassins team**: all Assassins.
- **Traitor teams**: each Traitor is effectively their own solo team.
- A player with a face-down identity is treated as an opponent with no teammates yet.

## 4. Building the Identity Deck (Rule 907.3)

Prepare exactly one identity card per player.

Requirements:
- Exactly **1 Leader**.
- At least **1 Traitor**.
- Number of Assassins = **floor(players / 2)**.
- Remaining cards are Guardian or Traitor.

Recommended distributions include:
- 4 players: 1 Leader, 1 Traitor, 2 Assassins
- 5 players: 1 Leader, 1 Traitor, 2 Assassins, 1 Guardian
- 6 players: 1 Leader, 1 Traitor, 3 Assassins, 1 Guardian
- 7 players: 1 Leader, 1 Traitor, 3 Assassins, 2 Guardians
- 8 players: 1 Leader, 2 Traitors, 3 Assassins, 2 Guardians

(There is also a Backstab Rumble option where non-Leader cards are Traitors.)

## 5. Game Setup Flow

1. Shuffle the identity deck.
2. Deal one face-down identity to each player.
3. Each player looks at their identity.
4. Put it in command zone:
   - face up if it has no Unveil
   - face down if it has Unveil
5. Hidden role information must be kept secret unless revealed.

## 6. Starting Player and Life

- The **Leader player** is the starting player (not random).
- Base Treachery life total is 20 unless modified by another variant.
- In Commander + Treachery, players usually start at 40 life.

## 7. Unveil (Keyword)

Unveil allows identity cards to begin face down and later be turned face up.

Key points:
- Turning your face-down identity face up is a **special action** (does not use the stack).
- You may do it any time you have priority.
- You reveal the card, pay its unveil cost, and turn it face up.
- "When [this identity] is unveiled" triggers when turned face up via this action.
- If unveil cost includes X, that X is reused by related abilities on that identity.
- Face-down identities must be revealed when their controller leaves the game, and at game end.

## 8. Undercover (Keyword Restriction)

Undercover is an unveil restriction (often on Guardians).

A card with Undercover can be unveiled only if:
- another non-Leader identity has already been revealed, **or**
- another player has attacked a Leader player this game.

Important nuance:
- Creatures that enter already attacking do not satisfy the "attacked" condition by themselves; the attack must come from proper attacker declaration.

## 9. Win/Loss Conditions (Treachery-specific)

All normal MTG end-game rules still apply, plus Treachery team logic.

- A team loses when all players on that team have lost.
- **Leader team loses** when all Leaders are gone, even if a Guardian remains.
- **Assassins team wins** if all Leaders are gone and at least one Assassin remains.
- **Traitor wins** only when all opponents are gone (including other Traitors).
- If any player on a team wins, that whole team wins.

## 10. When a Player Leaves the Game

Treachery adds special handling:
- Face-down identities of that player are revealed.
- Some identity-sourced abilities on the stack can remain.
- Some identity ownership/control handling differs from standard object cleanup.
- The game remembers the last team that player belonged to for team outcome checks.

## 11. Practical Play Notes

- Treachery is built around hidden information and timed reveals.
- Traitor is typically hardest to pilot because it is a solo role.
- Guardian/Leader coordination becomes stronger once identities are revealed.
- Assassin team pressure is usually focused on eliminating the Leader side.

## 12. For Rules Disputes

Use this summary for quick onboarding, then confirm exact edge cases in:
- https://mtgtreachery.net/rules/cr/
- https://mtgtreachery.net/rules/Treachery%20Rules.pdf
