extends SceneTree
## Raycast probe: is the terrain collision actually present in physics space?
var main
var t := 0.0
var done := false

func _init() -> void:
	var scn := load("res://Main.tscn") as PackedScene
	main = scn.instantiate()
	get_root().add_child(main)

func _process(delta: float) -> bool:
	t += delta
	if t < 0.5:
		return false
	if done:
		quit(); return true
	done = true
	var space: PhysicsDirectSpaceState3D = main.get_world_3d().direct_space_state
	# raycast straight down through where the horse spawned
	var hp = main.horse.global_position
	print("horse xz = ", Vector2(hp.x, hp.z), "  spawn y was ~", hp.y)
	for probe_y in [50.0]:
		var from := Vector3(hp.x, probe_y, hp.z)
		var to := Vector3(hp.x, -50.0, hp.z)
		var q := PhysicsRayQueryParameters3D.create(from, to)
		q.collide_with_areas = false
		q.exclude = [main.horse.get_rid()]
		var hit: Dictionary = space.intersect_ray(q)
		if hit:
			print("RAY HIT terrain at y=", hit.position.y, " collider=", hit.collider)
		else:
			print("RAY MISS — no terrain collision in physics space at this xz")
	# also report the sampled height there
	print("sample_height there = ", main.terrain.sample_height(hp.x, hp.z))
	quit()
	return true
