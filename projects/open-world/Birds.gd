extends Node3D
## A flock of birds that lazily circle the sky with flapping wings.
## Pure procedural (no assets): each bird is a small V of two wing quads that
## flap via a sine wave, drifting along gentle circular orbits.

@export var count := 14

var _birds: Array = []
var _t := 0.0

func _ready() -> void:
	var mat := StandardMaterial3D.new()
	mat.albedo_color = Color(0.12, 0.12, 0.14)   # dark silhouettes
	mat.roughness = 1.0
	mat.cull_mode = BaseMaterial3D.CULL_DISABLED
	for i in count:
		_birds.append(_make_bird(mat))

func _make_bird(mat: Material) -> Dictionary:
	var root := Node3D.new()
	add_child(root)

	var lwing := MeshInstance3D.new()
	lwing.mesh = _wing_mesh()
	lwing.material_override = mat
	root.add_child(lwing)

	var rwing := MeshInstance3D.new()
	rwing.mesh = _wing_mesh()
	rwing.scale.x = -1.0        # mirror
	rwing.material_override = mat
	root.add_child(rwing)

	return {
		"root": root,
		"lwing": lwing,
		"rwing": rwing,
		"radius": randf_range(60.0, 220.0),
		"height": randf_range(45.0, 90.0),
		"speed": randf_range(0.06, 0.16),
		"phase": randf() * TAU,
		"flap": randf_range(6.0, 10.0),
		"center": Vector2(randf_range(-150, 150), randf_range(-150, 150)),
	}

func _wing_mesh() -> ArrayMesh:
	var st := SurfaceTool.new()
	st.begin(Mesh.PRIMITIVE_TRIANGLES)
	# a simple triangular wing extending +x
	var a := Vector3(0, 0, 0.3)
	var b := Vector3(0, 0, -0.3)
	var c := Vector3(1.4, 0, 0)
	st.add_vertex(a); st.add_vertex(b); st.add_vertex(c)
	st.add_vertex(c); st.add_vertex(b); st.add_vertex(a)  # back face
	st.generate_normals()
	return st.commit()

func _process(delta: float) -> void:
	_t += delta
	for b in _birds:
		var ang: float = _t * b["speed"] + b["phase"]
		var pos := Vector3(
			b["center"].x + cos(ang) * b["radius"],
			b["height"] + sin(ang * 1.7) * 4.0,   # gentle bob
			b["center"].y + sin(ang) * b["radius"]
		)
		var root: Node3D = b["root"]
		root.position = pos
		# face direction of travel
		var vel := Vector3(-sin(ang), 0, cos(ang))
		root.look_at(pos + vel, Vector3.UP)
		# flap wings
		var flap: float = sin(_t * b["flap"] + b["phase"]) * 0.7
		(b["lwing"] as Node3D).rotation.z = flap
		(b["rwing"] as Node3D).rotation.z = -flap
