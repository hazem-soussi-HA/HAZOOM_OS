extends SceneTree
## Drive the horse forward and confirm it hugs the terrain (never falls/flies).
var main
var t := 0.0
var started := false

func _init() -> void:
	var scn := load("res://Main.tscn") as PackedScene
	main = scn.instantiate()
	get_root().add_child(main)

func _process(delta: float) -> bool:
	t += delta
	if t < 0.5:
		return false
	# simulate holding "forward + gallop"
	Input.action_press("move_forward")
	Input.action_press("gallop")
	if main and main.get("horse"):
		var h = main.horse
		if h and is_instance_valid(h) and main.get("terrain"):
			var g = main.terrain.sample_height(h.global_position.x, h.global_position.z)
			var diff = h.global_position.y - g
			if int(t * 4) % 2 == 0:
				print("t=%.2f pos_y=%.2f ground=%.2f diff=%.2f xz=(%.0f,%.0f)" % [
					t, h.global_position.y, g, diff, h.global_position.x, h.global_position.z])
	if t > 5.0:
		quit()
	return false
