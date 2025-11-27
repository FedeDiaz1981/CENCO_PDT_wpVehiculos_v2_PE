import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from '@microsoft/sp-core-library';
import {
  IPropertyPaneConfiguration,
  PropertyPaneToggle
} from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';

import RegistroVehicular from './components/RegistroVehicular';
import { initSP } from '../../pnp';

// Props configurables desde el panel del webpart
export interface IRegistroVehicularWebPartProps {
  vehiculosListTitle: string;
  proveedoresList: string;
  proveedoresDisplayField: string;
  proveedoresUserField: string;

  Proveedor: boolean;
  Distribuidor: boolean;
  Coordinador: boolean;
  Transportista: boolean;
  Borrar: boolean;
}

export default class RegistroVehicularWebPart
  extends BaseClientSideWebPart<IRegistroVehicularWebPartProps> {

  public render(): void {
    console.log("Render");
    const componentProps: any = {
      spContext: this.context,

      vehiculosListTitle: 'Vehiculos',
      proveedoresList: 'Proveedores',
      proveedoresDisplayField: 'Title',
      proveedoresUserField: 'Usuarios',
      
      Proveedor: this.properties.Proveedor ?? false,
      Distribuidor: false,
      Coordinador: false,
      Transportista: this.properties.Transportista ?? false,

      // pasa la config al componente React
      Borrar: this.properties.Borrar ?? false
    };

    const element = React.createElement(
      RegistroVehicular as any,
      componentProps
    );

    ReactDom.render(element, this.domElement);
  }

  protected onInit(): Promise<void> {
    initSP(this.context);
    return Promise.resolve();
  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }

  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }

  // Panel de propiedades (Property Pane)
  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: {
            description: 'Configuración Registro Vehicular'
          },
          groups: [
            {
              groupName: 'Roles / Permisos',
              groupFields: [
                PropertyPaneToggle('Proveedor', {
                  label: 'Proveedor',
                  onText: 'Sí',
                  offText: 'No',
                  checked: this.properties.Proveedor
                }),
                PropertyPaneToggle('Transportista', {
                  label: 'Transportista',
                  onText: 'Sí',
                  offText: 'No',
                  checked: this.properties.Transportista
                })
              ]
            },
            {
              groupName: 'Comportamiento de baja',
              groupFields: [
                PropertyPaneToggle('Borrar', {
                  label: 'Al dar de baja, borrar registro (en vez de marcar inactivo)',
                  onText: 'Borrar registro',
                  offText: 'Marcar Activo = false',
                  checked: this.properties.Borrar
                })
              ]
            }
          ]
        }
      ]
    };
  }
}
