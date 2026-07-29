extends CharacterBody3D
## Rideable horse (three.js Horse GLB, MIT) with land riding AND water swimming.
## LAND: WASD/arrows steer, Shift gallops; ground-clamps to terrain, leans on slopes.
## WATER: on entering a lake the horse swims (bobs at the surface). Hold Space to
##        DIVE underwater; release to rise. Camera tints & fogs underwater.
## Controls: WASD/arrows steer · Shift gallop · Space dive.

@export var walk_speed := 10.0
@export var gallop_speed := 32.0
@export var swim_speed := 6.0
@export var turn_speed := 2.4
@export var accel := 14.0
@export var gravity := 26.0
@export var model_scale := 0.012
@export var model_yaw_deg := 180.0
@export var foot_offset := 0.0
@export var dive_speed := 5.0            # vertical dive/rise rate
@export var buoyancy := 4.0              # how fast it floats back to surface

# camera feel
@export var cam_distance := 9.0
@export var cam_height := 4.0
@export var cam_pos_lag := 4.0
@export var cam_look_height := 1.6

var terrain                              # set by Main
var water_level := 1.5                   # copied from terrain
var speed := 0.0
var _in_water := false
var _dive_y := 0.0                       # target submersion depth when diving
var _anim: AnimationPlayer
var _model: Node3D
var _camera: Camera3D
var _cam_target := Vector3.ZERO
var _lean := 0.0
var _underwater := false
var _env_water: Environment

func _ready() -> void:
	up_direction = Vector3.UP
	floor_max_angle = deg_to_rad(60)
	floor_snap_length = 1.0
	_load_model()
	_build_collider()
	_build_camera()
	_build_water_env()

func _load_model() -> void:
	var scene := load("res://assets/Horse.glb") as PackedScene
	_model = scene.instantiate()
	_model.scale = Vector3.ONE * model_scale
	_model.rotation_degrees.y = model_yaw_deg
	add_child(_model)
	_anim = _model.find_child("AnimationPlayer", true, false)
	if _anim:
		var clip := _anim.get_animation("horse_A_")
		if clip:
			clip.loop_mode = Animation.LOOP_LINEAR
		_anim.play("horse_A_")
		_anim.speed_scale = 0.0

func _build_collider() -> void:
	var col := CollisionShape3D.new()
	var cap := CapsuleShape3D.new()
	cap.radius = 0.7
	cap.height = 2.4
	col.shape = cap
	col.position.y = 1.2
	add_child(col)

func _build_camera() -> void:
	_camera = Camera3D.new()
	_camera.fov = 70
	_camera.current = true
	add_child(_camera)
	_camera.top_level = true
	_camera.global_position = global_position + Vector3(0, cam_height, cam_distance)

## A dedicated underwater environment (blue tint + dense fog) swapped onto the
## camera while the head is below the surface.
func _build_water_env() -> void:
	_env_water = Environment.new()
	_env_water.background_mode = Environment.BG_COLOR
	_env_water.background_color = Color(0.05, 0.20, 0.30)
	_env_water.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	_env_water.ambient_light_color = Color(0.1, 0.3, 0.4)
	_env_water.ambient_light_energy = 0.6
	_env_water.fog_enabled = true
	_env_water.fog_light_color = Color(0.06, 0.28, 0.40)
	_env_water.fog_density = 0.08          # murky depth

func _physics_process(delta: float) -> void:
	if terrain and "WATER_LEVEL" in terrain:
		water_level = terrain.WATER_LEVEL

	# --- steering ---
	var turn := Input.get_axis("move_right", "move_left")
	var turn_factor: float = lerp(1.0, 0.6, clampf(absf(speed) / gallop_speed, 0.0, 1.0))
	rotate_y(turn * turn_speed * turn_factor * delta)

	# --- am I over/in a lake? ---
	var gx := global_position.x
	var gz := global_position.z
	var ground: float = terrain.sample_height(gx, gz) + foot_offset if terrain else 0.0
	var over_lake: bool = terrain.is_underwater(gx, gz) if terrain else false

	if over_lake and global_position.y <= water_level + 0.5:
		_swim(delta, ground)
	else:
		_ride(delta, ground)

	_drive_animation()
	_body_lean(turn, delta)
	_update_underwater()

## Normal land riding with terrain ground-clamp.
func _ride(delta: float, ground: float) -> void:
	_in_water = false
	var fwd_input := Input.get_axis("move_back", "move_forward")
	var galloping := Input.is_action_pressed("gallop")
	var target := 0.0
	if fwd_input != 0.0:
		target = fwd_input * (gallop_speed if galloping else walk_speed)
	var ramp := 3.0 if target != 0.0 else 5.0
	speed = move_toward(speed, target, accel * delta * ramp)

	var dir := -transform.basis.z
	velocity.x = dir.x * speed
	velocity.z = dir.z * speed
	velocity.y = 0.0
	move_and_slide()

	var gy := global_position.y
	if gy < ground or absf(gy - ground) < 1.5:
		global_position.y = lerpf(gy, ground, clampf(18.0 * delta, 0.0, 1.0))
	else:
		global_position.y = maxf(gy - gravity * delta, ground)
	if terrain:
		_orient_to_slope(global_position.x, global_position.z, delta)

## Swimming: horse floats at the surface; Space dives, buoyancy lifts it back.
func _swim(delta: float, lake_bottom: float) -> void:
	_in_water = true
	var fwd_input := Input.get_axis("move_back", "move_forward")
	var target := fwd_input * swim_speed
	speed = move_toward(speed, target, accel * delta * 3.0)

	var dir := -transform.basis.z
	velocity.x = dir.x * speed
	velocity.z = dir.z * speed

	# vertical: dive when holding Space, else bob back to surface
	var surface := water_level - 0.6      # body floats mostly submerged
	if Input.is_action_pressed("dive"):
		global_position.y -= dive_speed * delta
	else:
		global_position.y = move_toward(global_position.y, surface, buoyancy * delta)
	# never sink through the lake bed
	global_position.y = maxf(global_position.y, lake_bottom + 0.5)
	velocity.y = 0.0
	move_and_slide()

	# level the body while swimming (no slope pitch)
	if _model:
		_model.rotation.x = lerpf(_model.rotation.x, 0.0, delta * 4.0)

func _orient_to_slope(x: float, z: float, delta: float) -> void:
	if not _model or not terrain:
		return
	var e := 1.5
	var hx0: float = terrain.sample_height(x - e, z)
	var hx1: float = terrain.sample_height(x + e, z)
	var hz0: float = terrain.sample_height(x, z - e)
	var hz1: float = terrain.sample_height(x, z + e)
	var slope_z := (hz1 - hz0) / (2.0 * e)
	var target_pitch := clampf(atan(slope_z) * 0.6, -0.4, 0.4)
	_model.rotation.x = lerpf(_model.rotation.x, target_pitch, delta * 4.0)

func _drive_animation() -> void:
	if not _anim:
		return
	var s := absf(speed)
	if s < 0.15:
		_anim.speed_scale = 0.0
	else:
		var base := s / walk_speed
		_anim.speed_scale = clampf(base, 0.35, 3.0)

func _body_lean(turn: float, delta: float) -> void:
	if not _model:
		return
	var want := -turn * clampf(absf(speed) / gallop_speed, 0.0, 1.0) * 0.12
	_lean = lerp(_lean, want, delta * 5.0)
	_model.rotation.z = _lean

## Swap to the underwater environment when the camera dips below the surface.
func _update_underwater() -> void:
	if not _camera:
		return
	var head_below := _camera.global_position.y < water_level
	if head_below and not _underwater:
		_underwater = true
		_camera.environment = _env_water
	elif not head_below and _underwater:
		_underwater = false
		_camera.environment = null   # revert to world environment

func _process(delta: float) -> void:
	if not _camera:
		return
	var back := transform.basis.z
	# when diving, pull the camera lower & closer for an underwater feel
	var h := cam_height
	var d := cam_distance
	if _in_water:
		h = cam_height * 0.6
		d = cam_distance * 0.8
	var desired := global_position + back * d + Vector3(0, h, 0)
	# keep camera from going below the lake bed
	if terrain:
		var cam_ground: float = terrain.sample_height(desired.x, desired.z) + 0.5
		desired.y = maxf(desired.y, cam_ground)
	_camera.global_position = _camera.global_position.lerp(desired, clampf(cam_pos_lag * delta, 0.0, 1.0))
	var look := global_position + Vector3(0, cam_look_height, 0)
	_cam_target = _cam_target.lerp(look, clampf(8.0 * delta, 0.0, 1.0))
	_camera.look_at(_cam_target, Vector3.UP)
