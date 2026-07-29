extends Node3D
## Bootstraps the world: terrain, lighting/sky, horse spawn, HUD.

var terrain
var horse
var birds

func _ready() -> void:
	_setup_environment()
	terrain = preload("res://Terrain.gd").new()
	add_child(terrain)
	await get_tree().process_frame   # let terrain build & sample_height be ready

	# birds circling the sky
	birds = preload("res://Birds.gd").new()
	add_child(birds)

	horse = preload("res://Horse.gd").new()
	horse.terrain = terrain
	horse.water_level = terrain.WATER_LEVEL
	add_child(horse)
	# Spawn on dry ground (never in a lake); horse ground-clamps itself.
	var spawn := _find_dry_spawn()
	horse.global_position = Vector3(spawn.x, terrain.sample_height(spawn.x, spawn.z) + 1.0, spawn.z)

	_setup_hud()

## Find dry, flat ground above the water line and NOT inside a lake basin.
func _find_dry_spawn() -> Vector3:
	var min_above := 3.0
	var best := Vector3(30, 0, 30)
	var best_h := -999.0
	for i in 200:
		var x := randf_range(-300, 300)
		var z := randf_range(-300, 300)
		if terrain.is_underwater(x, z):
			continue
		var h: float = terrain.sample_height(x, z)
		var slope: float = absf(h - terrain.sample_height(x + 3, z)) + absf(h - terrain.sample_height(x, z + 3))
		if h > terrain.WATER_LEVEL + min_above and slope < 2.5:
			return Vector3(x, h, z)
		if h > best_h:
			best_h = h
			best = Vector3(x, h, z)
	return best

func _setup_environment() -> void:
	# --- Golden-hour sun (warm, low, long soft shadows) ---
	var sun := DirectionalLight3D.new()
	sun.rotation_degrees = Vector3(-28, -55, 0)     # low angle = cinematic
	sun.light_energy = 1.6
	sun.light_color = Color(1.0, 0.93, 0.80)        # warm sunlight
	sun.shadow_enabled = true
	sun.shadow_blur = 1.5
	sun.directional_shadow_mode = DirectionalLight3D.SHADOW_PARALLEL_4_SPLITS
	sun.directional_shadow_max_distance = 220.0
	sun.shadow_bias = 0.04
	add_child(sun)

	# --- Sky + ambient (dawn/dusk gradient) ---
	var env := Environment.new()
	var sky := Sky.new()
	var sky_mat := ProceduralSkyMaterial.new()
	sky_mat.sky_top_color = Color(0.25, 0.45, 0.82)
	sky_mat.sky_horizon_color = Color(0.92, 0.78, 0.62)   # warm horizon glow
	sky_mat.ground_horizon_color = Color(0.60, 0.52, 0.42)
	sky_mat.ground_bottom_color = Color(0.28, 0.30, 0.26)
	sky_mat.sun_angle_max = 8.0
	sky_mat.sun_curve = 0.08
	sky.sky_material = sky_mat
	env.background_mode = Environment.BG_SKY
	env.sky = sky
	env.ambient_light_source = Environment.AMBIENT_SOURCE_SKY
	env.ambient_light_energy = 0.5
	env.reflected_light_source = Environment.REFLECTION_SOURCE_SKY

	# --- Filmic tonemap + exposure ---
	env.tonemap_mode = Environment.TONE_MAPPER_ACES
	env.tonemap_exposure = 1.05
	env.tonemap_white = 6.0

	# --- Atmospheric fog + volumetric depth ---
	env.fog_enabled = true
	env.fog_light_color = Color(0.85, 0.80, 0.72)
	env.fog_sun_scatter = 0.3
	env.fog_density = 0.0022
	env.fog_aerial_perspective = 0.5
	env.fog_sky_affect = 0.4

	# --- Cinematic post: bloom, AO, subtle grade ---
	env.glow_enabled = true
	env.glow_intensity = 0.35
	env.glow_bloom = 0.15
	env.glow_hdr_threshold = 1.1
	env.ssao_enabled = true
	env.ssao_radius = 3.0
	env.ssao_intensity = 2.5
	env.ssil_enabled = true                          # screen-space indirect light
	env.adjustment_enabled = true
	env.adjustment_brightness = 1.02
	env.adjustment_contrast = 1.10
	env.adjustment_saturation = 1.18                 # lush, punchy colours

	var we := WorldEnvironment.new()
	we.environment = env
	add_child(we)

	# gentle fill light from the sky-opposite side to lift shadows (cinematic)
	var fill := DirectionalLight3D.new()
	fill.rotation_degrees = Vector3(-50, 130, 0)
	fill.light_energy = 0.25
	fill.light_color = Color(0.7, 0.8, 1.0)          # cool bounce
	fill.shadow_enabled = false
	add_child(fill)

func _setup_hud() -> void:
	var canvas := CanvasLayer.new()
	add_child(canvas)
	var label := Label.new()
	label.text = "OPEN WORLD  —  ride into nature\nWASD / Arrows: steer   Shift: gallop   Space: dive\nFind a lake and dive in. Explore."
	label.position = Vector2(20, 16)
	label.add_theme_color_override("font_color", Color.WHITE)
	label.add_theme_color_override("font_outline_color", Color.BLACK)
	label.add_theme_constant_override("outline_size", 4)
	canvas.add_child(label)
