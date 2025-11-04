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
  Proveedor: boolean;
  Transportista: boolean;
}

export default class RegistroVehicularWebPart
  extends BaseClientSideWebPart<IRegistroVehicularWebPartProps> {

  public render(): void {

    const componentProps: any = {
      spContext: this.context,

      vehiculosListTitle: 'Vehiculos',
      proveedoresList: 'Proveedores',
      proveedoresDisplayField: 'Title',
      proveedoresUserField: 'Usuarios',

      Proveedor: this.properties.Proveedor ?? false,
      Distribuidor: false,
      Coordinador: false,
      Transportista: this.properties.Transportista ?? false
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

  // Panel de propiedades (Property Pane): ahora con Proveedor y Transportista
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
            }
          ]
        }
      ]
    };
  }
}
