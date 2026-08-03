export type IdentityRole = 'KING' | 'KNIGHT' | 'BANDIT' | 'ASSASSIN' | 'USURPER';

export type Team = 'CROWN' | 'SHADOW' | 'ROGUE';

export interface RoleCard {
  role: IdentityRole;
  team: Team;
  title: string;
  objective: string;
  hint: string;
  rulings: string;
}

export interface Player {
  code: string;
  joinedAt: number;
  roleCard?: RoleCard;
}

export interface Room {
  code: string;
  createdAt: number;
  status: 'LOBBY' | 'STARTED';
  hostPlayerCode: string;
  players: Player[];
}

export interface KingdomDataCard {
  name?: string;
  text?: string;
  color?: string;
  type?: string;
  rulings?: string | string[];
  types?: {
    subtype?: string;
  };
}

export interface KingdomDataFile {
  cards?: KingdomDataCard[];
}

export interface RolePools {
  king: Omit<RoleCard, 'role' | 'team'>[];
  knight: Omit<RoleCard, 'role' | 'team'>[];
  bandit: Omit<RoleCard, 'role' | 'team'>[];
  assassin: Omit<RoleCard, 'role' | 'team'>[];
  usurper: Omit<RoleCard, 'role' | 'team'>[];
}

export interface RoomPlayerDto {
  code: string;
  joinedAt: number;
}

export interface RoomDto {
  code: string;
  status: 'LOBBY' | 'STARTED';
  createdAt: number;
  hostPlayerCode: string;
  players: RoomPlayerDto[];
}

export interface RoleCardDto {
  role: 'KING' | 'KNIGHT' | 'BANDIT' | 'ASSASSIN' | 'USURPER';
  team: 'CROWN' | 'SHADOW' | 'ROGUE';
  title: string;
  objective: string;
  hint: string;
  rulings: string;
}

export interface RoleSummaryDto {
  KING: number;
  KNIGHT: number;
  BANDIT: number;
  ASSASSIN: number;
  USURPER: number;
}
