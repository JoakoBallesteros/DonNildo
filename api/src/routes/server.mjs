import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import dotenv from 'dotenv'
import { auth } from './routes/auth.js'
dotenv.config()

const app = express()
app.use(cors())               // CORS para el front
app.use(express.json())       // JSON body
app.use(morgan('dev'))        // logs de requests

app.use('/v1/auth', auth)
app.get('/v1/health', (_req,res)=>res.json({ok:true}))

app.listen(process.env.PORT, ()=> console.log('API on :'+process.env.PORT))