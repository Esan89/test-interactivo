const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const multer = require('multer');
const XLSX = require('xlsx');
const path = require('path');

// Crear el servidor Express
const app = express();

// Habilitar CORS para todas las rutas
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Configurar multer para manejar archivos cargados
const upload = multer({ dest: 'uploads/' });

// Configurar la conexión a la base de datos MySQL
const conexion = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'test_interactivo'
});

// Conectar a la base de datos
conexion.connect((err) => {
  if (err) {
    console.error('Error conectando a la base de datos:', err);
    return;
  }
  console.log('Conexión exitosa a la base de datos MySQL');
});

// Ruta para cargar el archivo Excel
app.post('/upload-excel', upload.single('file'), (req, res) => {
  const rutaArchivo = req.file.path; // Ruta temporal del archivo subido
  const modulo = req.body.modulo;  // Tomamos el módulo seleccionado

  try {
    const workbook = XLSX.readFile(rutaArchivo);  // Leemos el archivo Excel
    const sheetName = workbook.SheetNames[0];     // Tomamos la primera hoja
    const sheet = workbook.Sheets[sheetName];
    const preguntasExcel = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    // Recorremos las preguntas y las guardamos en la base de datos
    preguntasExcel.forEach((fila, index) => {
      if (index > 1) { // Saltamos los encabezados
        const pregunta = fila[0];
        const opcion1 = fila[1];
        const opcion2 = fila[2];
        const opcion3 = fila[3];
        const opcion4 = fila[4];
        const respuesta_correcta = fila[5];  // Columna de la respuesta correcta

        // Guardamos la pregunta en la base de datos
        const query = `
          INSERT INTO preguntas (pregunta, opcion1, opcion2, opcion3, opcion4, respuesta_correcta, modulo)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        conexion.query(query, [pregunta, opcion1, opcion2, opcion3, opcion4, respuesta_correcta, modulo], (err, result) => {
          if (err) {
            console.error('Error al insertar la pregunta en la base de datos:', err);
          }
        });
      }
    });

    // Devolvemos la respuesta exitosa
    res.json({ success: true, message: 'Preguntas cargadas y guardadas correctamente en la base de datos.' });

  } catch (error) {
    console.error('Error procesando el archivo Excel:', error);
    res.status(500).json({ success: false, message: 'Error procesando el archivo Excel.' });
  }
});

// Iniciar el servidor
app.listen(4000, () => {
  console.log('Servidor ejecutándose en el puerto 4000');
});
