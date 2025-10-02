create extension if not exists pgcrypto;

insert into roles (nombre, descripcion) values
  ('ADMIN','Administrador'),
  ('OPERADOR','Operador del sistema')
on conflict (nombre) do nothing;

-- admin@local.com / admin123
insert into usuarios (dni, nombre, hash_contrasena, mail, id_rol, estado)
select
  '20000000',
  'Administrador',
  crypt('admin123', gen_salt('bf', 10)), -- bcrypt cost 10
  'admin@local.com',
  (select id_rol from roles where nombre='ADMIN'),
  'ACTIVO'
where not exists (select 1 from usuarios where mail='admin@local.com');