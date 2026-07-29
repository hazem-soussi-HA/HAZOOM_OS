extends Node3D
## Open-world nature terrain:
## - Rolling hills from layered noise (all above water by default).
## - Real LAKES: circular basins carved below the water line; water discs sit
##   only inside them (no more world-covering ocean or hardcoded river).
## - Collidable heightmap, scattered trees, lush grass.

const SIZE := 800.0        # world extent in metres (x/z) — bigger world
const RES := 300           # grid subdivisions
const HEIGHT := 34.0       # max hill amplitude
const WATER_LEVEL := 1.5   # surface height of every lake

var noise := FastNoiseLite.new()
# each lake: {c: Vector2 (center), r: float (radius), depth: float}
var lakes: Array = []

func _ready() -> void:
	randomize()
	noise.noise_type = FastNoiseLite.TYPE_PERLIN
	noise.frequency = 0.004
	noise.fractal_octaves = 5
	noise.seed = randi()
	_place_lakes(5)
	_build_terrain()
	_build_lakes()
	_scatter_trees(320)
	_scatter_grass(60000)

func _place_lakes(count: int) -> void:
	var half := SIZE * 0.5 - 80.0
	for i in count:
		lakes.append({
			"c": Vector2(randf_range(-half, half), randf_range(-half, half)),
			"r": randf_range(45.0, 90.0),
			"depth": randf_range(6.0, 12.0),
		})

## World-space height. Base hills are lifted above water; lakes carve basins.
func sample_height(x: float, z: float) -> float:
	var n := noise.get_noise_2d(x, z)              # -1..1
	var h := (n * 0.5 + 0.5) * HEIGHT              # 0..HEIGHT (dry by default)
	h += 2.0                                        # lift so shores sit above water
	# carve smooth basins for each lake
	for lake in lakes:
		var d: float = Vector2(x, z).distance_to(lake["c"])
		var r: float = lake["r"]
		if d < r:
			var t: float = 1.0 - (d / r)           # 0 at edge, 1 at center
			var dip: float = smoothstep(0.0, 1.0, t) * (lake["depth"] + 6.0)
			h -= dip
	return h

## Is this world point underwater (inside a lake basin below the surface)?
func is_underwater(x: float, z: float) -> bool:
	for lake in lakes:
		if Vector2(x, z).distance_to(lake["c"]) < lake["r"]:
			return sample_height(x, z) < WATER_LEVEL
	return false

func _build_terrain() -> void:
	var st := SurfaceTool.new()
	st.begin(Mesh.PRIMITIVE_TRIANGLES)
	var step := SIZE / RES
	var half := SIZE * 0.5
	for z in range(RES):
		for x in range(RES):
			var wx0 := -half + x * step
			var wz0 := -half + z * step
			var wx1 := wx0 + step
			var wz1 := wz0 + step
			var p00 := Vector3(wx0, sample_height(wx0, wz0), wz0)
			var p10 := Vector3(wx1, sample_height(wx1, wz0), wz0)
			var p01 := Vector3(wx0, sample_height(wx0, wz1), wz1)
			var p11 := Vector3(wx1, sample_height(wx1, wz1), wz1)
			_add_tri(st, p00, p01, p11)
			_add_tri(st, p00, p11, p10)
	st.generate_normals()
	var mesh := st.commit()

	var mi := MeshInstance3D.new()
	mi.mesh = mesh
	# Cinematic procedural terrain shader (slope+altitude blend, detail noise)
	var mat := ShaderMaterial.new()
	mat.shader = load("res://terrain.gdshader")
	mat.set_shader_parameter("water_level", WATER_LEVEL)
	mi.material_override = mat
	mi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_ON
	add_child(mi)

	# collision from the same mesh (canonical trimesh shape)
	var body := StaticBody3D.new()
	body.collision_layer = 1
	body.collision_mask = 1
	var shape := CollisionShape3D.new()
	var tri := mesh.create_trimesh_shape()
	shape.shape = tri
	body.add_child(shape)
	add_child(body)
	if tri and tri.get_faces().size() > 0:
		print("[Terrain] collision faces: ", tri.get_faces().size())
	else:
		push_error("[Terrain] TRIMESH SHAPE EMPTY — collision will fail")

func _add_tri(st: SurfaceTool, a: Vector3, b: Vector3, c: Vector3) -> void:
	for v in [a, b, c]:
		st.add_vertex(v)

## One translucent water disc per lake, sitting at WATER_LEVEL.
func _build_lakes() -> void:
	for lake in lakes:
		var disc := CylinderMesh.new()
		disc.top_radius = lake["r"]
		disc.bottom_radius = lake["r"]
		disc.height = 0.2
		disc.radial_segments = 48
		var mi := MeshInstance3D.new()
		mi.mesh = disc
		mi.position = Vector3(lake["c"].x, WATER_LEVEL, lake["c"].y)
		var mat := StandardMaterial3D.new()
		mat.albedo_color = Color(0.12, 0.38, 0.52, 0.72)
		mat.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
		mat.roughness = 0.03
		mat.metallic = 0.5
		mat.rim_enabled = true
		mi.material_override = mat
		add_child(mi)

func _scatter_trees(count: int) -> void:
	var half := SIZE * 0.5 - 10.0
	for i in count:
		var x := randf_range(-half, half)
		var z := randf_range(-half, half)
		var y := sample_height(x, z)
		# no trees in water or on high peaks
		if y < WATER_LEVEL + 1.5 or y > 24.0:
			continue
		add_child(_make_tree(Vector3(x, y, z)))

func _make_tree(pos: Vector3) -> Node3D:
	var tree := Node3D.new()
	tree.position = pos
	var scale := randf_range(0.8, 1.7)

	var trunk := MeshInstance3D.new()
	var tm := CylinderMesh.new()
	tm.top_radius = 0.15 * scale
	tm.bottom_radius = 0.28 * scale
	tm.height = 2.6 * scale
	trunk.mesh = tm
	trunk.position.y = 1.3 * scale
	var trunk_mat := StandardMaterial3D.new()
	trunk_mat.albedo_color = Color(0.33, 0.22, 0.12)
	trunk_mat.roughness = 0.95
	trunk.material_override = trunk_mat
	tree.add_child(trunk)

	# layered conifer-ish foliage (3 stacked cones look more natural)
	var leaf_mat := StandardMaterial3D.new()
	leaf_mat.albedo_color = Color(0.13, 0.32, 0.12).lerp(Color(0.28, 0.48, 0.16), randf())
	leaf_mat.roughness = 0.9
	for k in 3:
		var cone := MeshInstance3D.new()
		var cm := CylinderMesh.new()
		cm.top_radius = 0.0
		cm.bottom_radius = (1.7 - k * 0.4) * scale
		cm.height = 1.8 * scale
		cone.mesh = cm
		cone.position.y = (2.4 + k * 1.1) * scale
		cone.material_override = leaf_mat
		tree.add_child(cone)

	# trunk collision so you can't ride through it
	var body := StaticBody3D.new()
	body.collision_layer = 1
	body.collision_mask = 1
	var col := CollisionShape3D.new()
	var cyl := CylinderShape3D.new()
	cyl.radius = 0.5 * scale
	cyl.height = 4.0 * scale
	col.shape = cyl
	col.position.y = 2.0 * scale
	body.add_child(col)
	tree.add_child(body)
	return tree

## Lush grass field via a single MultiMesh (one draw call). Grassy flats only.
func _scatter_grass(count: int) -> void:
	var mm := MultiMesh.new()
	mm.transform_format = MultiMesh.TRANSFORM_3D
	mm.use_colors = true
	mm.mesh = _grass_blade_mesh()

	var half := SIZE * 0.5 - 5.0
	var placed := 0
	var xforms := []
	var colors := []
	for i in count * 2:
		if placed >= count:
			break
		var x := randf_range(-half, half)
		var z := randf_range(-half, half)
		var y := sample_height(x, z)
		if y < WATER_LEVEL + 1.0 or y > 22.0:
			continue
		var sx: float = sample_height(x + 1.0, z) - y
		var sz: float = sample_height(x, z + 1.0) - y
		if absf(sx) + absf(sz) > 1.6:
			continue
		var t := Transform3D()
		t = t.rotated(Vector3.UP, randf() * TAU)
		var s := randf_range(0.7, 1.5)
		t = t.scaled(Vector3(s, randf_range(0.8, 1.6), s))
		t.origin = Vector3(x, y, z)
		xforms.append(t)
		var g := randf()
		colors.append(Color(0.18 + g * 0.12, 0.34 + g * 0.16, 0.10 + g * 0.06))
		placed += 1

	mm.instance_count = placed
	for j in placed:
		mm.set_instance_transform(j, xforms[j])
		mm.set_instance_color(j, colors[j])

	var mmi := MultiMeshInstance3D.new()
	mmi.multimesh = mm
	var gmat := StandardMaterial3D.new()
	gmat.vertex_color_use_as_albedo = true
	gmat.roughness = 0.9
	gmat.cull_mode = BaseMaterial3D.CULL_DISABLED
	gmat.shading_mode = BaseMaterial3D.SHADING_MODE_PER_PIXEL
	mmi.material_override = gmat
	mmi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	add_child(mmi)
	print("[Terrain] grass blades placed: ", placed)

func _grass_blade_mesh() -> ArrayMesh:
	var st := SurfaceTool.new()
	st.begin(Mesh.PRIMITIVE_TRIANGLES)
	var w := 0.18
	var h := 0.9
	var quads := [
		[Vector3(-w, 0, 0), Vector3(w, 0, 0), Vector3(w, h, 0), Vector3(-w, h, 0)],
		[Vector3(0, 0, -w), Vector3(0, 0, w), Vector3(0, h, w), Vector3(0, h, -w)],
	]
	for q in quads:
		st.add_vertex(q[0]); st.add_vertex(q[1]); st.add_vertex(q[2])
		st.add_vertex(q[0]); st.add_vertex(q[2]); st.add_vertex(q[3])
	st.generate_normals()
	return st.commit()
