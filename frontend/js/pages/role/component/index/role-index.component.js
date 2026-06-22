import { BaseComponent } from "../../../../core/base-component.js"; // Corrección del .js                                                      
    import { apiRequest } from "../../../../core/api.js"; // Importamos el helper de la API                                                        
                                                                                                                                                   
    export class RoleIndexComponent extends BaseComponent {                                                                                        
      constructor() {                                                                                                                              
        super('js/pages/role/component/index/role-index.component.html');                                                                          
      }                                                                                                                                            
                                                                                                                                                   
      async onInit() {                                                                                                                             
        console.log('Página de roles cargada.');                                                                                                   
        await this.cargarRoles();                                                                                                                  
      }                                                                                                                                            
                                                                                                                                                   
      async cargarRoles() {                                                                                                                        
        const tblDatos = this.querySelector('#tbl-datos-roles');                                                                                   
        const loadingSpinner = this.querySelector('#loadingSpinner');                                                                              
        const tableContainer = this.querySelector('#tableContainer');                                                                              
        const emptyState = this.querySelector('#emptyState');                                                                                      
        const totalRolesBadge = this.querySelector('#totalRolesBadge');                                                                            
                                                                                                                                                   
        if (!tblDatos) return;                                                                                                                     
                                                                                                                                                   
        // 1. Mostrar cargador y ocultar tabla/estado vacío                                                                                        
        loadingSpinner.classList.remove('d-none');                                                                                                 
        tableContainer.classList.add('d-none');                                                                                                    
        if (emptyState) emptyState.classList.add('d-none');                                                                                        
                                                                                                                                                   
        try {                                                                                                                                      
          // 2. Hacemos la consulta al Backend (usando 'response' directamente)                                                                    
          const response = await apiRequest('/v1/roles');                                                                                          
          const roles = response || [];                                                                                                            
                                                                                                                                                   
          // Actualizar el badge del total                                                                                                         
          if (totalRolesBadge) {                                                                                                                   
            totalRolesBadge.textContent = `${roles.length} Registros`;                                                                             
          }                                                                                                                                        
                                                                                                                                                   
          // 3. Limpiamos la tabla                                                                                                                 
          tblDatos.innerHTML = '';                                                                                                                 
                                                                                                                                                   
          if (roles.length === 0) {                                                                                                                
            if (emptyState) emptyState.classList.remove('d-none');                                                                                 
            loadingSpinner.classList.add('d-none');                                                                                                
            return;                                                                                                                                
          }                                                                                                                                        
                                                                                                                                                   
          // 4. Pintar cada rol según las columnas de tu HTML                                                                                      
          roles.forEach(rol => {                                                                                                                   
            const tr = document.createElement('tr');                                                                                               
            tr.className = 'border-bottom border-light';                                                                                           
                                                                                                                                                   
            // Celda ID                                                                                                                            
            const tdId = document.createElement('td');                                                                                             
            tdId.className = 'ps-4 text-secondary fw-semibold';                                                                                    
            tdId.textContent = `#${rol.id}`;                                                                                                       
                                                                                                                                                   
            // Celda Nombre                                                                                                                        
            const tdNombre = document.createElement('td');                                                                                         
            const divNombre = document.createElement('div');                                                                                       
            divNombre.className = 'fw-bold text-dark';                                                                                             
            divNombre.textContent = rol.nombre;                                                                                                    
            tdNombre.appendChild(divNombre);                                                                                                       
                                                                                                                                                   
            // Celda Descripción                                                                                                                   
            const tdDescripcion = document.createElement('td');                                                                                    
            tdDescripcion.textContent = rol.descripcion || '-';                                                                                    
                                                                                                                                                   
            // Celda Rol Padre (Si tu backend no carga 'parent', mostramos el padre_id)                                                            
            const tdPadre = document.createElement('td');                                                                                          
            if (rol.parent && rol.parent.nombre) {                                                                                                 
              tdPadre.textContent = rol.parent.nombre;                                                                                             
            } else if (rol.padre_id) {                                                                                                             
              tdPadre.textContent = `Rol #${rol.padre_id}`;                                                                                        
            } else {                                                                                                                               
              tdPadre.textContent = '-';                                                                                                           
            }                                                                                                                                      
                                                                                                                                                   
            // Celda Fecha de Creación                                                                                                             
            const tdFecha = document.createElement('td');                                                                                          
            tdFecha.className = 'text-muted small';                                                                                                
            tdFecha.textContent = rol.created_at                                                                                                   
              ? new Date(rol.created_at).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' })                          
              : '-';                                                                                                                               
                                                                                                                                                   
            const tdAcciones = document.createElement('td');                                                                                       
            tdAcciones.className = 'text-center';                                                                                                  
                                                                                                                                                   
            const divDropdown = document.createElement('div');                                                                                     
            divDropdown.className = 'dropdown';                                                                                                    
                                                                                                                                                   
            // El botón con los tres puntos                                                                                                        
            const btnDropdown = document.createElement('button');                                                                                  
            btnDropdown.className = 'btn btn-light text-secondary p-1.5 rounded-2 border-0';                                                       
            btnDropdown.type = 'button';                                                                                                           
            btnDropdown.setAttribute('data-bs-toggle', 'dropdown');                                                                                
            btnDropdown.setAttribute('aria-expanded', 'false');                                                                                    
                                                                                                                                                   
            const iDots = document.createElement('i');                                                                                             
            iDots.className = 'bi bi-three-dots-vertical fs-6'; // Icono de tres puntos                                                            
            btnDropdown.appendChild(iDots);                                                                                                        
                                                                                                                                                   
            // Menú desplegable                                                                                                                    
            const ulMenu = document.createElement('ul');                                                                                           
            ulMenu.className = 'dropdown-menu dropdown-menu-end shadow-sm border-0';                                                               
                                                                                                                                                   
            // Opción: Editar                                                                                                                      
            const liEdit = document.createElement('li');                                                                                           
            const aEdit = document.createElement('a');                                                                                             
            aEdit.className = 'dropdown-item d-flex align-items-center gap-2 px-3 py-2 text-primary small fw-medium';                              
            aEdit.setAttribute('href', `#/roles/form?id=${rol.id}`);                                                                               
                                                                                                                                                   
            const iEdit = document.createElement('i');                                                                                             
            iEdit.className = 'bi bi-pencil-square';                                                                                               
            aEdit.appendChild(iEdit);                                                                                                              
            aEdit.appendChild(document.createTextNode(' Editar'));                                                                                 
            liEdit.appendChild(aEdit);                                                                                                             
                                                                                                                                                   
            // Opción: Eliminar                                                                                                                    
            const liDelete = document.createElement('li');                                                                                         
            const btnDelete = document.createElement('button');                                                                                    
            btnDelete.className = 'dropdown-item d-flex align-items-center gap-2 px-3 py-2 text-danger btn-eliminar border-0 bg-transparent w-100 small fw-medium text-start';
            btnDelete.addEventListener('click', () => this.eliminarRol(rol.id, rol.nombre));
  
            const iDelete = document.createElement('i');
            iDelete.className = 'bi bi-trash';
            btnDelete.appendChild(iDelete);
            btnDelete.appendChild(document.createTextNode(' Eliminar'));
            liDelete.appendChild(btnDelete);
  
            // Unimos el dropdown
            ulMenu.appendChild(liEdit);
            ulMenu.appendChild(liDelete);
            divDropdown.appendChild(btnDropdown);
            divDropdown.appendChild(ulMenu);
            tdAcciones.appendChild(divDropdown);
                                                                                                                                       
            // Agregar celdas al tr                                                                                                                
            tr.appendChild(tdId);                                                                                                                  
            tr.appendChild(tdNombre);                                                                                                              
            tr.appendChild(tdDescripcion);                                                                                                         
            tr.appendChild(tdPadre);                                                                                                               
            tr.appendChild(tdFecha);                                                                                                               
            tr.appendChild(tdAcciones);                                                                                                            
  
            tblDatos.appendChild(tr);
          });
  
          // 5. Apagar el spinner y mostrar la tabla de resultados
          loadingSpinner.classList.add('d-none');
          tableContainer.classList.remove('d-none');
  
        } catch (error) {
          console.error('Error cargando roles:', error);
          loadingSpinner.classList.add('d-none');
          const errorAlert = this.querySelector('#errorAlert');
          const errorMessage = this.querySelector('#errorMessage');
          if (errorAlert && errorMessage) {
            errorMessage.textContent = `Error al cargar roles: ${error.message}`;
            errorAlert.classList.remove('d-none');
          }
        }
      }

  
      async eliminarRol(id, nombre) {
        if (confirm(`¿Estás seguro de que deseas eliminar el rol "${nombre}"?`)) {
          try {
            await apiRequest(`/v1/roles/${id}`, { method: 'DELETE' });
            alert('Rol eliminado con éxito.');
            await this.cargarRoles(); // Recargamos la tabla
          } catch (error) {
            console.error('Error al eliminar el rol:', error);
            alert(`Error al eliminar: ${error.message}`);
          }
        }
      }
    }
  
    customElements.define('app-role-index', RoleIndexComponent);