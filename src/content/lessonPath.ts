import type { CategoryGroup, ModuleId } from '../types';

export type PathNodeKind = 'lesson' | 'practice' | 'checkpoint' | 'treasure';

export interface PathNode {
  id: string;
  title: string;
  subtitle: string;
  kind: PathNodeKind;
  /** Route to start this node */
  to: string;
  moduleId: ModuleId;
  /** Optional category filter for spotter/learn */
  categoryGroup?: CategoryGroup;
  /** XP awarded for finishing a session on this node */
  xpReward: number;
  /** Questions / items expected in a session */
  sessionSize: number;
}

export interface PathUnit {
  id: string;
  title: string;
  description: string;
  nodes: PathNode[];
}

/** Duolingo-style ordered skill path for Spotter Field Guide */
export const LESSON_PATH: PathUnit[] = [
  {
    id: 'unit-1',
    title: 'Unit 1 · Ramp Basics',
    description: 'Learn the shapes you see at every hub — then prove it on photos.',
    nodes: [
      {
        id: 'u1-study-jets',
        title: 'Study · Narrowbodies',
        subtitle: 'Key features of A320 / 737 families',
        kind: 'lesson',
        to: '/learn?group=commercial-jets&node=u1-study-jets',
        moduleId: 'learn',
        categoryGroup: 'commercial-jets',
        xpReward: 15,
        sessionSize: 5,
      },
      {
        id: 'u1-spot-easy',
        title: 'Practice · Type ID',
        subtitle: '10 photos · name the aircraft',
        kind: 'practice',
        to: '/spotter?mode=easy&group=commercial-jets&node=u1-spot-easy',
        moduleId: 'spotter',
        categoryGroup: 'commercial-jets',
        xpReward: 20,
        sessionSize: 10,
      },
      {
        id: 'u1-codes',
        title: 'Practice · Easy Codes',
        subtitle: 'IATA codes · ground level',
        kind: 'practice',
        to: '/codes?tier=easy&node=u1-codes',
        moduleId: 'codes',
        xpReward: 15,
        sessionSize: 8,
      },
      {
        id: 'u1-checkpoint',
        title: 'Checkpoint',
        subtitle: 'Mix of photos you just studied',
        kind: 'checkpoint',
        to: '/spotter?mode=easy&group=commercial-jets&node=u1-checkpoint',
        moduleId: 'spotter',
        categoryGroup: 'commercial-jets',
        xpReward: 25,
        sessionSize: 8,
      },
    ],
  },
  {
    id: 'unit-2',
    title: 'Unit 2 · Twin Aisle',
    description: 'Widebodies, long-haul rivals, and freighter tells.',
    nodes: [
      {
        id: 'u2-study-wide',
        title: 'Study · Widebodies',
        subtitle: '747, 777, A330, A350 family tells',
        kind: 'lesson',
        to: '/learn?group=commercial-jets&node=u2-study-wide',
        moduleId: 'learn',
        categoryGroup: 'commercial-jets',
        xpReward: 15,
        sessionSize: 5,
      },
      {
        id: 'u2-spot',
        title: 'Practice · Hub Heavies',
        subtitle: 'Identify big twins and quads',
        kind: 'practice',
        to: '/spotter?mode=easy&group=commercial-jets&node=u2-spot',
        moduleId: 'spotter',
        categoryGroup: 'commercial-jets',
        xpReward: 20,
        sessionSize: 10,
      },
      {
        id: 'u2-deep',
        title: 'Deep Dive · Rivals',
        subtitle: 'Match Boeing ↔ Airbus counterparts',
        kind: 'practice',
        to: '/deepdive?node=u2-deep',
        moduleId: 'deepdive',
        xpReward: 20,
        sessionSize: 6,
      },
    ],
  },
  {
    id: 'unit-3',
    title: 'Unit 3 · Regionals & Props',
    description: 'CRJs, E-Jets, Dash 8s, ATRs — the feeder fleet.',
    nodes: [
      {
        id: 'u3-study-prop',
        title: 'Study · Propellers',
        subtitle: 'Turboprop silhouettes',
        kind: 'lesson',
        to: '/learn?group=propeller&node=u3-study-prop',
        moduleId: 'learn',
        categoryGroup: 'propeller',
        xpReward: 15,
        sessionSize: 5,
      },
      {
        id: 'u3-spot-prop',
        title: 'Practice · Feeders',
        subtitle: 'Props and regional jets',
        kind: 'practice',
        to: '/spotter?mode=easy&group=propeller&node=u3-spot-prop',
        moduleId: 'spotter',
        categoryGroup: 'propeller',
        xpReward: 20,
        sessionSize: 10,
      },
      {
        id: 'u3-treasure',
        title: 'Bonus Chest',
        subtitle: 'Perfect score → extra XP',
        kind: 'treasure',
        to: '/spotter?mode=easy&node=u3-treasure',
        moduleId: 'spotter',
        xpReward: 30,
        sessionSize: 5,
      },
    ],
  },
  {
    id: 'unit-4',
    title: 'Unit 4 · Bizjets & Oddballs',
    description: 'Gulfstreams, Citations, and the weird stuff worth spotting.',
    nodes: [
      {
        id: 'u4-study-biz',
        title: 'Study · Business Jets',
        subtitle: 'T-tails, oval windows, S-ducts',
        kind: 'lesson',
        to: '/learn?group=business-jets&node=u4-study-biz',
        moduleId: 'learn',
        categoryGroup: 'business-jets',
        xpReward: 15,
        sessionSize: 5,
      },
      {
        id: 'u4-spot-biz',
        title: 'Practice · Biz Ramp',
        subtitle: 'Name the corporate fleet',
        kind: 'practice',
        to: '/spotter?mode=easy&group=business-jets&node=u4-spot-biz',
        moduleId: 'spotter',
        categoryGroup: 'business-jets',
        xpReward: 20,
        sessionSize: 8,
      },
      {
        id: 'u4-hard',
        title: 'Challenge · Variants',
        subtitle: 'Hard mode photo ID',
        kind: 'checkpoint',
        to: '/spotter?mode=hard&node=u4-hard',
        moduleId: 'spotter',
        xpReward: 30,
        sessionSize: 8,
      },
    ],
  },
];

export const DAILY_XP_GOAL = 50;
export const MAX_CROWNS = 5;
export const XP_PER_CORRECT = 2;

export function flattenPathNodes(): PathNode[] {
  return LESSON_PATH.flatMap((u) => u.nodes);
}

export function getNodeById(id: string): PathNode | undefined {
  return flattenPathNodes().find((n) => n.id === id);
}

export function getUnitForNode(nodeId: string): PathUnit | undefined {
  return LESSON_PATH.find((u) => u.nodes.some((n) => n.id === nodeId));
}
