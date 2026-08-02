export interface RoomPlayerDto {
  code: string;
  name: string;
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
}

export interface RoleSummaryDto {
  LEADER: number;
  GUARDIAN: number;
  ASSASSIN: number;
  TRAITOR: number;
}
