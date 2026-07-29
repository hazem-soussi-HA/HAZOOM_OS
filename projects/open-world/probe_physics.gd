extends SceneTree
## Headless physics probe: does the horse settle on the terrain or fall forever?
var main
var t := 0.0

func _init() -> void:
	var scn := load("res://Main.tscn") as PackedScene
	main = scn.instantiate()
	get_root().add_child(main)
	# run physics for ~3s
	var timer := 0.0

func _process(delta: float) -> bool:
	t += delta
	if main and main.get("horse"):
		var h = main.horse
		if h and is_instance_valid(h):
			var floor_state = "?"
			if h.has_method("is_on_floor"):
				floor_state = str(h.is_on_floor())
			print("t=%.2f  y=%.3f  on_floor=%s  vel_y=%.2f" % [t, h.global_position.y, floor_state, h.velocity.y])
	if t > 3.0:
		# report terrain collision presence
		var terr = main.get("terrain")
		if terr:
			var bodies := 0
			for c in terr.get_children():
				if c is StaticBody3D:
					bodies += 1
					for gc in c.get_children():
						if gc is CollisionShape3D:
							print("TERRAIN StaticBody found, shape=", gc.shape, " layer=", c.collision_layer)
			print("terrain static bodies: ", bodies)
		quit()
	return false
