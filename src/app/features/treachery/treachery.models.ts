export type IdentityRole = 'LEADER' | 'GUARDIAN' | 'ASSASSIN' | 'TRAITOR';

export type Team = 'LEADER_TEAM' | 'ASSASSINS_TEAM' | 'TRAITOR_TEAM';

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

export interface TreacheryDataCard {
  name?: string;
  text?: string;
  color?: string;
  type?: string;
  rulings?: string | string[];
  types?: {
    subtype?: string;
  };
}

export interface TreacheryDataFile {
  cards?: TreacheryDataCard[];
}

export interface RolePools {
  leader: Omit<RoleCard, 'role' | 'team'>[];
  guardian: Omit<RoleCard, 'role' | 'team'>[];
  assassin: Omit<RoleCard, 'role' | 'team'>[];
  traitor: Omit<RoleCard, 'role' | 'team'>[];
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
  role: 'LEADER' | 'GUARDIAN' | 'ASSASSIN' | 'TRAITOR';
  team: 'LEADER_TEAM' | 'ASSASSINS_TEAM' | 'TRAITOR_TEAM';
  title: string;
  objective: string;
  hint: string;
  rulings: string;
}

export interface RoleSummaryDto {
  LEADER: number;
  GUARDIAN: number;
  ASSASSIN: number;
  TRAITOR: number;
}
