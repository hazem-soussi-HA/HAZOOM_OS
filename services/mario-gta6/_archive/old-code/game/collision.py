"""AABB collision system."""
from .constants import TILE, SOLID_TILES


def aabb_overlap(ax, ay, aw, ah, bx, by, bw, bh):
    return ax < bx + bw and ax + aw > bx and ay < by + bh and ay + ah > by


def player_tile_collision(px, py, pw, ph, lvl, vy, ww, wh):
    """
    Proper AABB collision between player and tile map.
    Returns (new_px, new_py, hit_ground, hit_ceiling, hit_left, hit_right)
    """
    hit_ground = False
    hit_ceiling = False
    hit_left = False
    hit_right = False

    tx1 = max(0, int(px // TILE))
    tx2 = min(ww - 1, int((px + pw) // TILE))
    ty1 = max(0, int(py // TILE))
    ty2 = min(wh - 1, int((py + ph) // TILE))

    for ty in range(ty1, ty2 + 1):
        for tx in range(tx1, tx2 + 1):
            if 0 <= ty < wh and 0 <= tx < ww:
                tile = lvl[ty][tx]
                if tile in SOLID_TILES:
                    tile_rect = (tx * TILE, ty * TILE, TILE, TILE)
                    if aabb_overlap(px, py, pw, ph, *tile_rect):
                        overlap_left = (px + pw) - tile_rect[0]
                        overlap_right = tile_rect[0] + tile_rect[2] - px
                        overlap_top = (py + ph) - tile_rect[1]
                        overlap_bottom = tile_rect[1] + tile_rect[3] - py

                        min_overlap = min(overlap_left, overlap_right, overlap_top, overlap_bottom)

                        if min_overlap == overlap_bottom and vy >= 0:
                            py = tile_rect[1] - ph
                            hit_ground = True
                        elif min_overlap == overlap_top and vy < 0:
                            py = tile_rect[1] + tile_rect[3]
                            hit_ceiling = True
                        elif min_overlap == overlap_left:
                            px = tile_rect[0] - pw
                            hit_left = True
                        elif min_overlap == overlap_right:
                            px = tile_rect[0] + tile_rect[2]
                            hit_right = True

    return px, py, hit_ground, hit_ceiling, hit_left, hit_right
