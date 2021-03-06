import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { ApiService } from 'src/app/services/api.service';
import { SelectionModel } from '@angular/cdk/collections';
import { FormControl, FormGroup } from '@angular/forms';
import { MatSort, MatPaginator, MatTableDataSource, MatDialog, MatDialogRef } from '@angular/material';
import { Subscription } from 'rxjs';
import { AddDialogComponent } from 'src/app/_partials/dialogs/add-dialog/add-dialog.component';
import { Router } from '@angular/router';
import { SharedService } from 'src/app/services/shared.service';

@Component({
	selector: 'app-destinations',
	templateUrl: './destinations.component.html',
	styleUrls: ['./destinations.component.scss']
})
export class DestinationsComponent implements OnInit, OnDestroy {

  allDestinations: any;
	isAdmin: boolean;
	dialogRef: MatDialogRef<any>;

  categorySubsription: Subscription;
  countrySubsription: Subscription;

	filterForm = new FormGroup({
		country: new FormControl(''),
		category: new FormControl(''),
		stars: new FormControl(null)
	});

  chosenFilter = { country: [], category: [], stars: [] };
	tableFilters = Object.keys(this.chosenFilter);
	filteredItems: string;

  dataColumns = ['name', 'region', 'country', 'category', 'stars'];
  visitorColumns = ['view', ...this.dataColumns];
  adminColumns = ['select', 'view', ...this.dataColumns, 'settings'];
  displayedColumns = [...this.visitorColumns]; 

	dataSource;
	selection = new SelectionModel(true, []);
  searchInput = new FormControl('');

	@ViewChild(MatSort) sort: MatSort;
	@ViewChild(MatPaginator) paginator: MatPaginator;

	constructor(
		private sharedService: SharedService,
		private apiService: ApiService,
		private matDialog: MatDialog,
		private router: Router
	) {}

	ngOnInit() {
    this.openSubsriptions();
	}

	openSubsriptions() {
		this.subsribeToAdmin()
		this.subsribeToDestination();
  }
  
  ngOnDestroy() {
		this.categorySubsription.unsubscribe();
		this.countrySubsription.unsubscribe();
  }

	getCategory() {
		this.categorySubsription = this.sharedService.activeCategories.subscribe(
			res => {
        this.chosenFilter.category = res;
        this.filterTable();
      }
		);
	}

	getCountry() {
		this.countrySubsription = this.sharedService.activeCountries.subscribe(
			res => {
        this.chosenFilter.country = res;
        this.filterTable();
      }
		);
	}
	
  onDialog(id?) {
    this.dialogRef = this.matDialog.open(AddDialogComponent, {
      width: '600px',
      height: '600px',
      data: {
				title: id ? 'Update Desination' : 'Create new Destination',
				id: id || null
			}
		});
		this.subscribeToDialogClosed();
	}

	onVisit(id?) {
    this.router.navigateByUrl('/destinations/' + id);
	}

	subscribeToDialogClosed() {
		
    this.dialogRef.afterClosed().subscribe(object => {
			const { id, doc } = object;
      if ( id ) {
				this.apiService.updateDestination(doc, id);
      } else {
				this.apiService.postDestination(doc);
			}
			
			this.filterTable();
    });
	}

	subsribeToDestination() {
    this.apiService.getCollectionItems('destinations').subscribe(res => {
			this.allDestinations = res;
			this.getCategory();
			this.getCountry();
		})
	}

	subsribeToAdmin() {
		this.sharedService.isLogged.subscribe(res => {
			this.displayedColumns = res ? [...this.adminColumns] : [...this.visitorColumns]; 
			this.isAdmin = res;
		})
	}

  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  onMasterToggle() {
    this.isAllSelected() ?
      this.selection.clear() :
      this.dataSource.data.forEach(row => this.selection.select(row));
  }

	returnTableBody(element, path) {
		const splited = (path && path.split('/')) || [];
		const path0 = element[splited[0]];
		const path1 = path0 && path0[splited[1]];
		const path2 = path1 && path1[splited[2]];
		const value = path2 || path1 || path0 || null;
		return value;
  }

	onDeleteRow(id) {
	  this.apiService.deleteDestination(id)
	}

	/* TABLE FEATURES */
	generateTable(data) {
		this.dataSource = new MatTableDataSource(data);
		this.dataSource.sort = this.sort;
		this.dataSource.paginator = this.paginator;
  }
  
  applyFilter(filterValue: string) {
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  onItemsChange(object) {
    this.chosenFilter[object.key] = object.value;
  }

	filterTable() {

    let filteredData = [...this.allDestinations];

		const keys = Object.keys(this.chosenFilter);
		const items = [];

    keys.forEach(key => {
			let value = this.chosenFilter[key] && this.chosenFilter[key].map( el => el.name || el);
      if (value.length) {
				value.forEach(it => items.push(it));
        filteredData = filteredData.filter( element => value.includes(element[key]) );
      }
    });

		this.generateTable(filteredData);
		this.filteredItems = items.join(', ');    
    
	}
}
