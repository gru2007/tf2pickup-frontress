export type RconCommand =
  | `changelevel ${string}`
  | `sm_game_player_add ${string} -name "${string}" -team ${string} -class ${string}`
  | `sm_game_player_delall`
  | `sm_game_player_del ${string}`
  | `sm_game_player_whitelist ${0 | 1}`
  | `tf_mm_match_begin ${string}`
  | `tf_mm_match_ready ${string}`
  | `tf_mm_match_add ${string}`
  | `tf_mm_match_end ${string}`
  | `tf_match_emulation ${number}`
  | `tf_match_emulation_restartmatch ${0 | 1}`
  | `tf_match_emulation_randommap ${0 | 1}`
  | `tf_mm_trusted ${0 | 1}`
  | `maxplayers ${number}`
  | `sv_tags ${string}`
  | `echo ${string}`
  | `exec ${string}`
  | `kickall`
  | `log on`
  | `sv_logsecret ${string}`
  | `logaddress_add ${string}`
  | `logaddress_del ${string}`
  | `logstf_title ${string}`
  | `logstf_autoupload ${0 | 1 | 2}`
  | `sv_password ${string}`
  | `tftrue_whitelist_id ${string}`
  | `tv_port`
  | `tv_port ${string}`
  | `tv_password`
  | `tv_password ${string}`
  | `say ${string}`
  | `status`
