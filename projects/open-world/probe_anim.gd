extends SceneTree
## Verify the gallop clip is set to loop and keeps advancing (no freeze).
var main
var t := 0.0
var samples := []
func _init() -> void:
	var scn := load("res://Main.tscn") as PackedScene
	main = scn.instantiate()
	get_root().add_child(main)
func _process(delta: float) -> bool:
	t += delta
	if t < 0.6:
		return false
	var h = main.get("horse")
	if h and is_instance_valid(h):
		var ap = h._model.find_child("AnimationPlayer", true, false)
		if ap:
			var clip = ap.get_animation("horse_A_")
			# force full-speed playback for the test
			ap.speed_scale = 2.0
			samples.append(ap.current_animation_position)
			if samples.size() == 1:
				print("loop_mode=%d (1=LINEAR) clip_length=%.2f" % [clip.loop_mode, clip.length])
	if t > 4.0:
		# did the position wrap around (loop) rather than stick at the end?
		var mx = 0.0
		for s in samples: mx = max(mx, s)
		print("max_pos_seen=%.2f  last_pos=%.2f  samples=%d" % [mx, samples[-1], samples.size()])
		var wrapped = false
		for i in range(1, samples.size()):
			if samples[i] < samples[i-1] - 0.1:
				wrapped = true; break
		print("ANIM LOOPS (wrapped)=%s" % wrapped)
		quit()
	return false
