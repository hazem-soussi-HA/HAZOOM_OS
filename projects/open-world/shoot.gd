extends SceneTree
## Load the world, let it render a few frames on the GPU, then save a screenshot.
var main
var frames := 0

func _init() -> void:
	var scn := load("res://Main.tscn") as PackedScene
	main = scn.instantiate()
	get_root().add_child(main)

func _process(_delta: float) -> bool:
	frames += 1
	if frames < 40:
		return false
	# move the camera to a nice overlook of the horse for the shot
	var img := get_root().get_texture().get_image()
	img.save_png("/tmp/ow_shot.png")
	print("SCREENSHOT saved: /tmp/ow_shot.png  size=", img.get_size())
	quit()
	return true
