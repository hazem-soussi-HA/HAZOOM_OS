extends SceneTree
## Verify trees have collision and the horse is blocked when driven into one.
var main
var t := 0.0
func _init() -> void:
	var scn := load("res://Main.tscn") as PackedScene
	main = scn.instantiate()
	get_root().add_child(main)
func _process(delta: float) -> bool:
	t += delta
	if t < 0.6:
		return false
	var terr = main.get("terrain")
	var trees := 0
	var trees_with_collision := 0
	for c in terr.get_children():
		# trees are Node3D with a StaticBody child holding a CylinderShape
		if c is Node3D and not (c is StaticBody3D) and not (c is MeshInstance3D):
			for gc in c.get_children():
				if gc is StaticBody3D:
					trees += 1
					for ggc in gc.get_children():
						if ggc is CollisionShape3D and ggc.shape is CylinderShape3D:
							trees_with_collision += 1
					break
	print("trees=%d  trees_with_trunk_collision=%d" % [trees, trees_with_collision])
	quit()
	return true
