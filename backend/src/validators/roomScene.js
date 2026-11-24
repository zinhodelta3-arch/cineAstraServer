import { z } from 'zod';

const types = ['seat','vip','bench','car','screen','stage','speaker','podium','wall','floor','door','barrier','light','column','tree','planter','curtain','stage360','riser','aisle','turf','bleacher','rib','sconce','ceiling-light'];
const point = z.number().min(-2000).max(2000);
const scale = z.number().min(.05).max(200);
const object = z.object({
    id: z.number().int().min(1).max(16777215),
    type: z.enum(types),
    x: point, y: point, z: point,
    sx: scale, sy: scale, sz: scale,
    rotation: z.number().min(-10000).max(10000),
    color: z.string().regex(/^#[a-f0-9]{6}$/i),
    label: z.string().max(100),
    seatId: z.string().regex(/^[1-9]\d{0,9}$/).optional()
}).strict();

export const roomScene = z.object({
    format: z.literal('CineAstra-Studio-3D'),
    version: z.literal(2),
    environment: z.enum(['cinema','theater','drivein','stadium','park','container','banker','custom']),
    name: z.string().trim().min(1).max(70),
    sceneSize: z.number().gt(1).max(240),
    objects: z.array(object).min(1).max(1200)
}).strict();
