extends SceneTree
## One-shot: print the Horse.glb structure, animations, and bounds.
func _init() -> void:
	var scene := load("res://assets/Horse.glb") as PackedScene
	if scene == null:
		print("FAILED to load Horse.glb")
		quit(); return
	var root := scene.instantiate()
	print("ROOT: ", root.name, " (", root.get_class(), ")")
	_walk(root, 0)
	quit()

func _walk(n: Node, depth: int) -> void:
	var pad := ""
	for i in depth: pad += "  "
	var extra := ""
	if n is AnimationPlayer:
		extra = "  ANIMS=" + str((n as AnimationPlayer).get_animation_list())
	if n is MeshInstance3D:
		var aabb := (n as MeshInstance3D).get_aabb()
		extra = "  AABB size=" + str(aabb.size)
	print(pad, n.name, " [", n.get_class(), "]", extra)
	for c in n.get_children():
		_walk(c, depth + 1)
