package LigaSync.API.dto;

import LigaSync.API.model.Deporte;

public record LigaBuscadaDto(Long id, String nombre, Deporte deporte) {}
