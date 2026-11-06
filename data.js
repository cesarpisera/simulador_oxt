// Catálogos y obras de ejemplo del simulador.
// Todo lo que se quiera ajustar (listas, obras de prueba) se edita acá.

window.SIM_DATA = {
  // Obras de ejemplo (datos ficticios). Agregá o cambiá las que quieras.
  obras: [
    {
      nroProyecto: "ER00-00001",
      provincia: "BUENOS AIRES",
      localidad: "MERCEDES",
      tipo: "TERCEROS",
      contratista: "CONTRATISTA DEMO S.A.",
      tipoObra: "04",
      presion: "M.P",
      metrosPrevistos: 55,
      observaciones: "",
      lat: -34.6667,
      lng: -59.4167
    },
    {
      nroProyecto: "ER00-00002",
      provincia: "BUENOS AIRES",
      localidad: "LUJAN",
      tipo: "TERCEROS",
      contratista: "OBRAS DEL OESTE SRL",
      tipoObra: "02",
      presion: "B.P",
      metrosPrevistos: 120,
      observaciones: "Cruce de calle",
      lat: -34.5703,
      lng: -59.105
    },
    {
      nroProyecto: "ER00-00003",
      provincia: "BUENOS AIRES",
      localidad: "MORENO",
      tipo: "TERCEROS",
      contratista: "REDES Y GAS SA",
      tipoObra: "01",
      presion: "M.P",
      metrosPrevistos: 32,
      observaciones: "",
      lat: -34.6503,
      lng: -58.79
    }
  ],

  materiales: ["Acero", "Polietileno"],

  fasesEjecucion: ["OBRA_CIVIL", "MECANICA", "EMPALME", "PRUEBAS", "SERVICIOS", "OTROS"],

  hitos: ["1", "2", "3", "4", "5"],

  // Tipos de defecto. multiple:true = casillas (varias opciones), false = opción única.
  defectos: [
    {
      id: "mecanico",
      titulo: "Defecto mecánico de obra",
      detalle: "Detalle del defecto mecánico de obra",
      multiple: true,
      opciones: [
        "No se cumplen los procedimientos en las uniones",
        "Tipo de fusion no adecuado al diametro y a la tuberia",
        "Lector de codigo de barras no reconoce accesorio",
        "No respetar los valores de temperatura -tiempos - presiones - etc.",
        "Tubos a fusiones no redondeados",
        "Tubos a fusiones no sujetos con dispositivos de ajuste circular",
        "Fusionar con malas condiciones atm - sin precauciones o si el caso lo requiere sin autorizacion del inspector",
        "Superficies a fusionar dañadas - sucias - engrasadas - humedas",
        "No mantener las piezas inmovilizadas y/o alineadas con las herramientas que correspondan durante la fusion y hasta su enfriamiento",
        "Ejecutar uniones por electrofusion existiendo fugas a traves del pinzado",
        "No se respetan las distancias minimas a otros servicios",
        "Deficiencia en la ejecucion de prueba de hermeticidad y fuga",
        "Uniones deficientes",
        "Defectos en la tuberia y accesorios",
        "Tuberias a profundidad incorrecta",
        "Deficiencias en el herramental",
        "Distancias minimas a obstaculos",
        "Distancia minima a linea municipal",
        "Irregularidaes en el pinzado de la cañeria",
        "Instalacion de tee williamson",
        "Soldaduras",
        "Revestimiento",
        "Pruebas",
        "Proteccion catodica",
        "Conversiones",
        "Otros motivos"
      ]
    },
    {
      id: "civil",
      titulo: "Defecto civil de obra",
      detalle: "Detalle del defecto civil de obra",
      multiple: true,
      opciones: [
        "Zanja ejecutada en forma incorrecta",
        "Material de tapada inadecuado",
        "Falta de malla de advertencia",
        "Compactacion de zanjeo",
        "Otros motivos"
      ]
    },
    {
      id: "seguridad",
      titulo: "Defecto en seguridad de obra",
      detalle: "Detalle del defecto de seguridad de obra",
      multiple: true,
      opciones: [
        "Proteccion de zanjas abiertas",
        "Balizamiento",
        "Señalizacion",
        "Pasos peatonales - sendas de circulacion y/o de transito de vehiculos (deficientes)",
        "Daños a instalaciones de otras empresas de servicios publicos",
        "Acciones imprudentes",
        "Puesta en gas",
        "Apuntalamiento de zanjas",
        "Instalacion electrica en obra",
        "Fugas de gas",
        "Indumentaria del personal",
        "Otros motivos"
      ]
    },
    {
      id: "imagen",
      titulo: "Defecto en imagen de obra",
      detalle: "Detalle del defecto en imagen de obra",
      multiple: true,
      opciones: [
        "Reparacion de verdas y/o frentes",
        "Orden y limpieza de obra",
        "Disposicion de materiales en obra",
        "Ubicación de equipos en la via publica",
        "Informacion deficiente",
        "Otros motivos"
      ]
    },
    {
      id: "documentacion",
      titulo: "Defecto en documentacion",
      detalle: "Detalle del defecto en documentacion",
      multiple: false,
      opciones: [
        "Fusionista o soldador autorizado (calificacion no se corresponde con el tipo de union)",
        "Fusiones no identificadas",
        "Otros motivos - mora en el plazo de obra (1 punto por dia)",
        "Permisos - certificados - matriculas - proyecto constructivo - croquis - planos conforme a obra",
        "Permisos de obra",
        "Certificado de art (cobertura con nomina) - identificacion del personal en obra - programa de seguridad",
        "Matricula de fusionista - soldador - pcs",
        "Certificado de calibracion de instrumentos (vigencia y correspondencia)",
        "Certificado de recarga de matafuegos - capacidad - tipo (polvo y co2)",
        "Certificado de calidad de materiales (vigencia y correspondencia)",
        "Documentacion ambiental: declaracion jurada o estudio de impacto ambiental / capacitacion ambiental"
      ]
    },
    {
      id: "ambiente",
      titulo: "Defecto medio ambiente",
      detalle: "Detalle del defecto medio ambiente",
      multiple: true,
      opciones: [
        "Afectacion / derrames: agua - suelo - aire",
        "Arbolado y cobertura vegetal - afectacion raices - reposicion",
        "Residuos: clasificacion - tratamiento y disposicion final",
        "Almacenamiento - tratamiento hidrocarburos - metanol",
        "Contaminacion auditiva",
        "Otros motivos"
      ]
    }
  ]
};
